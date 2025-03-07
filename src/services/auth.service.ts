import { IAuthService } from "../interfaces/IAuthService";
import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import bcrypt from "bcrypt";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";
import { generateOtp } from "../helpers/otp.helper";
import createHttpError from "http-errors";
import { signAccessToken, signRefreshToken } from "../helpers/jwt.helper";
import logger from "../helpers/logger";
import redisHelper from "../helpers/redis.helper";
import sendUserEvents from "../messaging/rabbitmq/user-events.producer";
import sendValidationOtp from "../messaging/rabbitmq/otp.producer";

class AuthService implements IAuthService {
    private authRepository: IAuthRepository;
    private usernameRepository: IUsernameRepository;

    constructor(authRepository: IAuthRepository, usernameRepository: IUsernameRepository) {
        this.authRepository = authRepository;
        this.usernameRepository = usernameRepository;
    }

    /* Create new user account */
    async createNewUser(authDetails: Auth): Promise<string> {
        logger.debug("Entering createNewUser method", { method: "createNewUser", layer: "service", email: authDetails.email });
        try {
            logger.info(`Creating new user. Email: ${authDetails.email}`, { layer: "service" });

            // Check if user already exists
            const userExists = await this.authRepository.findByEmail(authDetails.email!);
            if (userExists) {
                logger.warn(`User already exists. Email: ${authDetails.email}`, { layer: "service" });
                throw createHttpError(409, "User already exists");
            }

            // Hash the password
            logger.debug("Hashing password", { layer: "service", email: authDetails.email });
            const hashedPassword = await bcrypt.hash(authDetails.password!, 10);
            logger.info(`Password hashed successfully. Email: ${authDetails.email}`, { layer: "service" });

            // Save the user with the hashed password
            authDetails.password = hashedPassword;
            const user = await this.authRepository.create(authDetails);
            logger.info(`User created successfully. ID: ${user.id}, Email: ${user.email}`, { layer: "service" });

            // Update username in the profile database
            logger.debug("Updating username in profile database", { layer: "service", userID: user.id });
            await this.usernameRepository.updateUsername(user.id!, authDetails.username!);
            logger.info(`Username updated successfully in profile database. UserID: ${user.id}`, { layer: "service" });

            // Generate OTP and store it
            logger.debug("Generating and storing OTP", { layer: "service", userID: user.id });
            const otp = await this.generateAndStoreOtp(user.id!);
            logger.info(`OTP generated and stored successfully. UserID: ${user.id}`, { layer: "service" });

            // Send OTP to notification service
            logger.debug("Sending OTP to notification service", { layer: "service", userID: user.id });
            sendValidationOtp("otp", user.email!, otp);
            logger.info(`OTP sent successfully to notification service. UserID: ${user.id}`, { layer: "service" });

            return user.id!;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HTTP error occurred while creating new user. Email: ${authDetails.email}`, { method: "createNewUser", layer: "service", email: authDetails.email, error });
                throw error;
            } else {
                logger.error(`Unexpected error occurred while creating new user. Email: ${authDetails.email}`, { method: "createNewUser", layer: "service", email: authDetails.email, error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug("Exiting createNewUser method", { method: "createNewUser", layer: "service", email: authDetails.email });
        }
    }

    /* Login existing user */
    async loginUser(authDetails: Auth): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }> {
        logger.debug("Entering loginUser method", { method: "loginUser", layer: "service", email: authDetails.email });
        try {
            logger.info(`Login request received. Email: ${authDetails.email}`, { layer: "service" });

            const userDetails = await this.authRepository.findByEmail(authDetails.email!);

            if (userDetails?.status === "blocked") {
                logger.warn(`User is blocked. Email: ${authDetails.email}`, { layer: "service" });
                throw createHttpError(401, "User is blocked by admin from accessing the application");
            }

            if (!userDetails) {
                logger.warn(`User not found. Email: ${authDetails.email}`, { layer: "service" });
                throw createHttpError(401, "Invalid user credentials");
            }

            logger.debug("Validating user password", { layer: "service", email: authDetails.email });
            const passwordHashResult = await bcrypt.compare(authDetails.password!, userDetails.password!);
            if (!passwordHashResult) {
                logger.warn(`Incorrect password entered. Email: ${authDetails.email}`, { layer: "service" });
                throw createHttpError(401, "Invalid user credentials");
            }

            logger.debug("Generating access and refresh tokens", { layer: "service", email: authDetails.email });
            const accessToken = signAccessToken(userDetails.id!);
            const refreshToken = signRefreshToken(userDetails.id!);
            logger.info(`Tokens generated successfully. Email: ${authDetails.email}`, { layer: "service" });

            await redisHelper.set(`RefreshToken:${userDetails.id!}`, refreshToken, 7 * 24 * 60 * 60);
            logger.info(`Refresh token stored in Redis. UserID: ${userDetails.id}`, { layer: "service" });

            const basicUserProfile = await this.authRepository.getBasicProfile(userDetails.id!);
            logger.info(`Basic profile fetched successfully. Email: ${authDetails.email}`, { layer: "service" });

            return { accessToken, refreshToken, username: basicUserProfile.username, profilePicture: basicUserProfile.profilePicture };
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HTTP error occurred while logging in user. Email: ${authDetails.email}`, { method: "loginUser", layer: "service", email: authDetails.email, error });
                throw error;
            } else {
                logger.error(`Unexpected error occurred while logging in user. Email: ${authDetails.email}`, { method: "loginUser", layer: "service", email: authDetails.email, error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug("Exiting loginUser method", { method: "loginUser", layer: "service", email: authDetails.email });
        }
    }

    /* Confirm user exists */
    async confirmUser(email: string): Promise<boolean> {
        logger.debug(`Entering confirmUser method. Email: ${email}`, { method: "confirmUser", layer: "service" });
        try {
            logger.info(`Confirm user request received. Email: ${email}`, { layer: "service" });

            const userDetails = await this.authRepository.findByEmail(email);
            logger.debug(`User details fetched from database. Email: ${email}`, { layer: "service" });

            if (!userDetails) {
                logger.warn(`User not found. Email: ${email}`, { layer: "service" });
                throw createHttpError(401, "Invalid email credentials");
            }

            logger.debug(`Generating reset link. Email: ${email}`, { layer: "service" });
            const accessToken = signAccessToken(userDetails.id!);
            logger.debug(`Access token generated: ${accessToken}. Email: ${email}`, { layer: "service" });
            const resetLink = `http://localhost:8080/reset-password?token=${accessToken}`;
            logger.info(`Reset link generated for user. Email: ${email}`, { layer: "service" });
            logger.debug(`Reset link: ${resetLink}. Email: ${email}`, { layer: "service" });

            sendValidationOtp("link", email, resetLink);
            logger.info(`Reset link sent to notification service. Email: ${email}`, { layer: "service" });
            logger.debug(`Notification service request sent. Email: ${email}. Reset link: ${resetLink}`, { layer: "service" });

            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HTTP error occurred while confirming user. Email: ${email}. Error: ${error.message}`, { method: "confirmUser", layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error occurred while confirming user. Email: ${email}. Error: ${error.message}`, { method: "confirmUser", layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting confirmUser method. Email: ${email}`, { method: "confirmUser", layer: "service" });
        }
    }

    /* Validate OTP */
    async validateOTP(otp: string, userID: string): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }> {
        logger.debug(`Entering validateOTP method. UserID: ${userID}`, { method: "validateOTP", layer: "service" });
        try {
            logger.info(`Validate OTP request received. UserID: ${userID}`, { layer: "service" });

            const otpDetails = await this.authRepository.getOTP(userID);
            logger.debug(`OTP details fetched from database. UserID: ${userID}`, { layer: "service" });

            if (!otpDetails?.otp || !otpDetails?.expiresAt) {
                logger.warn(`OTP not found. UserID: ${userID}`, { layer: "service" });
                throw createHttpError(400, "Invalid OTP");
            }

            logger.debug(`Checking OTP expiry. UserID: ${userID}`, { layer: "service" });
            const currentTime = new Date();
            const otpExpiryTime = new Date(otpDetails.expiresAt);
            logger.debug(`Current time: ${currentTime.toISOString()}. OTP Expiry Time: ${otpExpiryTime.toISOString()}. UserID: ${userID}`, { layer: "service" });
            if (otpExpiryTime < currentTime) {
                logger.warn(`OTP expired. UserID: ${userID}`, { layer: "service" });
                throw createHttpError(400, "OTP has expired");
            }

            if (otp !== otpDetails.otp) {
                logger.warn(`Incorrect OTP entered. UserID: ${userID}`, { layer: "service" });
                throw createHttpError(400, "Invalid OTP");
            }

            logger.info(`OTP validated successfully. UserID: ${userID}`, { layer: "service" });

            logger.debug(`Fetching basic profile details. UserID: ${userID}`, { layer: "service" });
            const basicUserProfile = await this.authRepository.getBasicProfile(userID);
            logger.debug(`Basic profile details fetched from database. UserID: ${userID}`, { layer: "service" });
            logger.info(`Basic profile fetched for user. UserID: ${userID}`, { layer: "service" });

            logger.debug(`Generating access and refresh tokens. UserID: ${userID}`, { layer: "service" });
            const accessToken = signAccessToken(otpDetails.userID);
            const refreshToken = signRefreshToken(otpDetails.userID);
            logger.debug(`Access token generated: ${accessToken}. Refresh token generated: ${refreshToken}. UserID: ${userID}`, { layer: "service" });
            logger.info(`Tokens generated for user. UserID: ${userID}`, { layer: "service" });

            logger.debug(`Sending basic profile to rabbitMQ. UserID: ${userID}`, { layer: "service" });
            sendUserEvents({ type: "user", ...basicUserProfile });
            logger.info(`Basic profile sent to rabbitMQ for UserID: ${userID}`, { layer: "service" });
            logger.debug(`RabbitMQ request sent. UserID: ${userID}. Basic profile: ${JSON.stringify(basicUserProfile)}`, { layer: "service" });

            await redisHelper.set(`RefreshToken:${otpDetails.userID!}`, refreshToken, 7 * 24 * 60 * 60);
            logger.info(`Stored refresh token in redis cache for the user: ${otpDetails.userID}`, { layer: "service" });
            logger.debug(`Redis cache updated. UserID: ${otpDetails.userID}. Refresh token: ${refreshToken}`, { layer: "service" });

            return { accessToken, refreshToken, username: basicUserProfile.username, profilePicture: basicUserProfile.profilePicture };
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HTTP error occurred while validating OTP. UserID: ${userID}. Error: ${error.message}`, { method: "validateOTP", layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error occurred while validating OTP. UserID: ${userID}. Error: ${error.message}`, { method: "validateOTP", layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting validateOTP method. UserID: ${userID}`, { method: "validate OTP", layer: "service" });
        }
    }

    /* Resend OTP */
    async resendOtp(userID: string): Promise<boolean> {
        logger.debug(`Entering resendOtp method. UserID: ${userID}`, { method: "resendOtp", layer: "service" });
        try {
            logger.info(`Resend OTP request received. UserID: ${userID}`, { layer: "service" });

            const userDetails = await this.authRepository.getBasicProfile(userID);
            logger.debug(`User details fetched from database. UserID: ${userID}`, { layer: "service" });

            const otp = await this.generateAndStoreOtp(userID);
            logger.info(`OTP resent to user. UserID: ${userID}`, { layer: "service" });
            logger.debug(`OTP value: ${otp}. UserID: ${userID}`, { layer: "service" });

            const email = await this.authRepository.getEmailByUserId(userID);
            logger.debug(`Email fetched from database. UserID: ${userID}. Email: ${email}`, { layer: "service" });

            sendValidationOtp("otp", email, otp);
            logger.info(`OTP sent to user via notification service. UserID: ${userID}`, { layer: "service" });
            logger.debug(`Notification service request sent. UserID: ${userID}. Email: ${email}. OTP: ${otp}`, { layer: "service" });

            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HTTP error occurred while resending OTP. UserID: ${userID}. Error: ${error.message}`, { method: "resendOtp", layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error occurred while resending OTP. UserID: ${userID}. Error: ${error.message}`, { method: "resendOtp", layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting resendOtp method. UserID: ${userID}`, { method: "resendOtp", layer: "service" });
        }
    }

    /* Reset password */
    async resetPassword(userID: string, password: string): Promise<boolean> {
        logger.debug(`Entering resetPassword method. UserID: ${userID}`, { method: "resetPassword", layer: "service" });
        try {
            logger.info(`Reset password request received. UserID: ${userID}`, { layer: "service" });

            const hashedPassword = await bcrypt.hash(password, 10);
            logger.debug(`Password hashed for user. UserID: ${userID}. Hashed password: ${hashedPassword}`, { layer: "service" });
            logger.info(`Password hashed for user. UserID: ${userID}`, { layer: "service" });

            await this.authRepository.resetPassword(userID, hashedPassword);
            logger.info(`Password reset successfully. UserID: ${userID}`, { layer: "service" });
            logger.debug(`Password reset database operation completed. UserID: ${userID}`, { layer: "service" });

            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HTTP error occurred while resetting password. UserID: ${userID}. Error: ${error.message}`, { method: "resetPassword", layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error occurred while resetting password. UserID: ${userID}. Error: ${error.message}`, { method: "resetPassword", layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting resetPassword method. UserID: ${userID}`, { method: "resetPassword", layer: "service" });
        }
    }

    /* Generate and store OTP */
    async generateAndStoreOtp(userID: string): Promise<number> {
        logger.debug(`Entering generateAndStoreOtp method. UserID: ${userID}`, { method: "generateAndStoreOtp", layer: "service" });
        try {
            logger.info(`Generating OTP for user. UserID: ${userID}`, { layer: "service" });

            const otp = generateOtp();
            logger.debug(`OTP generated for user. UserID: ${userID}. OTP: ${otp}`, { layer: "service" });
            logger.info(`OTP generated for user. UserID: ${userID}`, { layer: "service" });
            console.log("OTP generated :::", otp);

            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + Number(process.env.OTP_EXPIRATION_MINUTES));
            logger.debug(`OTP expiration time set. UserID: ${userID}. Expiration time: ${expiresAt.toISOString()}`, { layer: "service" });

            await this.authRepository.saveOTP({ userID, otp, expiresAt });
            logger.info(`OTP stored for user. UserID: ${userID}`, { layer: "service" });
            logger.debug(`OTP stored in database. UserID: ${userID}. OTP: ${otp}. Expiration time: ${expiresAt.toISOString()}`, { layer: "service" });

            return otp;
        } catch (error) {
            logger.error(`Error generating and storing OTP. UserID: ${userID}. Error: ${error.message}`, { method: "generateAndStoreOtp", layer: "service" });
            throw createHttpError(500, "An unexpected error occurred");
        } finally {
            logger.debug(`Exiting generateAndStoreOtp method. UserID: ${userID}`, { method: "generateAndStoreOtp", layer: "service" });
        }
    }

    /* OAuth signup */
    async ouathSignup(email: string, picture: string, name: string, provider: string): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }> {
        logger.debug(`Entering ouathSignup method. Email: ${email}, Provider: ${provider}`, { method: "ouathSignup", layer: "service" });
        logger.info(`OAuth signup request received. Email: ${email}, Provider: ${provider}`, { layer: "service" });
        try {
            let userDetails = await this.authRepository.findByEmail(email);
            logger.debug(`User  details fetched from database. Email: ${email}`, { layer: "service" });

            if (!userDetails) {
                logger.info(`Signing up new user via OAuth. Email: ${email}, Provider: ${provider}`, { layer: "service" });
                const resp = await this.authRepository.saveOauthUser (email, provider, name, picture);
                logger.debug(`New user saved. UserID: ${resp.id}`, { layer: "service" });

                const accessToken = signAccessToken(resp.id!);
                const refreshToken = signRefreshToken(resp.id!);
                logger.info(`Tokens generated for new OAuth user. Email: ${email}`, { layer: "service" });

                await redisHelper.set(`RefreshToken:${resp.id!}`, refreshToken, 7 * 24 * 60 * 60); //store in redis for seven days
                logger.info(`Stored refresh token in redis cache for the user: ${resp.id!}`, { layer: "service" });

                /* send basic profile to rabbitMQ */
                sendUserEvents({ type: "user", userID: resp.id!, username: name, profilePicture: picture });
                logger.debug(`Basic profile sent to rabbitMQ for new user. UserID: ${resp.id!}`, { layer: "service" });

                return { accessToken, refreshToken, username: name, profilePicture: picture };
            } else {
                if (userDetails?.status === "blocked") {
                    logger.warn(`User  is blocked. Email: ${email}`, { layer: "service" });
                    throw createHttpError(401, "User  is blocked by admin from accessing the application");
                }

                if (userDetails.provider === provider) {
                    logger.info(`Existing user signing in via OAuth. Email: ${email}`, { layer: "service" });
                    const accessToken = signAccessToken(userDetails.id!);
                    const refreshToken = signRefreshToken(userDetails.id!);
                    logger.info(`Tokens generated for existing OAuth user. Email: ${email}`, { layer: "service" });

                    await redisHelper.set(`RefreshToken:${userDetails.id!}`, refreshToken, 7 * 24 * 60 * 60); //store in redis for seven days
                    logger.info(`Stored refresh token in redis cache for the user: ${userDetails.id}`, { layer: "service" });

                    const basicUserProfile = await this.authRepository.getBasicProfile(userDetails.id!);
                    logger.debug(`Basic profile fetched for user. UserID: ${userDetails.id}`, { layer: "service" });

                    return { accessToken, refreshToken, username: basicUserProfile.username, profilePicture: basicUserProfile.profilePicture };
                } else {
                    logger.warn(`User  used a different authentication provider. Email: ${email}`, { layer: "service" });
                    throw new Error("Try other signin methods");
                }
            }
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error in OAuth signup. Email: ${email}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in OAuth signup. Email: ${email}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting ouathSignup method. Email: ${email}`, { method: "ouathSignup", layer: "service" });
        }
    }

    /* generate new access and refresh token on token expiration */
    async generateNewTokens(userID: string): Promise<{ accessToken: string; refreshToken: string }> {
        logger.debug(`Entering generateNewTokens method. UserID: ${userID}`, { method: "generateNewTokens", layer: "service" });
        try {
            logger.info(`Generating new access and refresh tokens for UserID: ${userID}`, { layer: "service" });
            const accessToken = signAccessToken(userID);
            const refreshToken = signRefreshToken(userID);
            logger.info(`Generated new access and refresh tokens for UserID: ${userID}`, { layer: "service" });

            await redisHelper.set(`RefreshToken:${userID}`, refreshToken, 7 * 24 * 60 * 60); //store in redis for seven days
            logger.info(`Stored refresh token in redis cache for the user: ${userID}`, { layer: "service" });
            return { accessToken, refreshToken };
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error in generateNewTokens. UserID: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in generateNewTokens. UserID: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting generateNewTokens method. UserID: ${userID}`, { method: "generateNewTokens", layer: "service" });
        }
    }
}

export default AuthService;