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

class AuthService implements IAuthService {
    private authRepository: IAuthRepository;
    private usernameRepository: IUsernameRepository;

    constructor(authRepository: IAuthRepository, usernameRepository: IUsernameRepository) {
        this.authRepository = authRepository;
        this.usernameRepository = usernameRepository;
    }

    /* Create new user account */
    async createNewUser(authDetails: Auth): Promise<string> {
        logger.info(`Creating new user. Email: ${authDetails.email}`);
        try {
            // Check if user already exists
            const userExists = await this.authRepository.findByEmail(authDetails.email!);
            if (userExists) {
                logger.warn(`User already exists. Email: ${authDetails.email}`);
                throw createHttpError(409, "User already exists");
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(authDetails.password!, 10);
            logger.info(`Password hashed for user. Email: ${authDetails.email}`);

            // Save the user with the hashed password
            authDetails.password = hashedPassword;
            const user = await this.authRepository.create(authDetails);
            logger.info(`User created successfully. ID: ${user.id}, Email: ${user.email}`);

            // Update username in the profile database
            await this.usernameRepository.updateUsername(user.id!, authDetails.username!);
            logger.info(`Username updated in profile database. UserID: ${user.id}`);

            // Generate OTP and store it
            await this.generateAndStoreOtp(user.id!);
            logger.info(`OTP generated and stored for user. UserID: ${user.id}`);

            // Send OTP to notification service
            console.log("Sending OTP to the notification service");

            return user.id!;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error creating new user. Email: ${authDetails.email}`, { error });
                throw error;
            } else {
                logger.error(`Unexpected error creating new user. Email: ${authDetails.email}`, { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* Login existing user */
    async loginUser(authDetails: Auth): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }> {
        logger.info(`Login request received. Email: ${authDetails.email}`);
        try {
            // Check if user exists
            const userDetails = await this.authRepository.findByEmail(authDetails.email!);
            if (!userDetails) {
                logger.warn(`User not found. Email: ${authDetails.email}`);
                throw createHttpError(401, "Invalid user credentials");
            }

            // Validate password
            const passwordHashResult = await bcrypt.compare(authDetails.password!, userDetails.password!);
            if (!passwordHashResult) {
                logger.warn(`Incorrect password entered. Email: ${authDetails.email}`);
                throw createHttpError(401, "Invalid user credentials");
            }

            // Generate tokens
            const accessToken = signAccessToken(userDetails.id!);
            const refreshToken = signRefreshToken(userDetails.id!);
            console.log(accessToken, refreshToken, " ::: accessToken, refreshToken");
            logger.info(`Tokens generated for user. Email: ${authDetails.email}`);

            await redisHelper.set(`RefreshToken:${userDetails.id!}`, refreshToken, 7 * 24 * 60 * 60); //store in redis for seven days
            logger.info("Stored refresh token in redis cache for the user: ", userDetails.id);

            // Fetch basic profile details
            const basicUserProfile = await this.authRepository.getBasicProfile(userDetails.id!);
            logger.info(`Basic profile fetched for user. Email: ${authDetails.email}`);

            return { accessToken, refreshToken, username: basicUserProfile.username, profilePicture: basicUserProfile.profilePicture };
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error logging in user. Email: ${authDetails.email}`, { error });
                throw error;
            } else {
                logger.error(`Unexpected error logging in user. Email: ${authDetails.email}`, { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* Confirm user exists */
    async confirmUser(email: string): Promise<boolean> {
        logger.info(`Confirm user request received. Email: ${email}`);
        try {
            const userDetails = await this.authRepository.findByEmail(email);
            console.log(userDetails);
            if (!userDetails) {
                logger.warn(`User not found. Email: ${email}`);
                throw createHttpError(401, "Invalid email credentials");
            }

            // Generate reset link
            const accessToken = signAccessToken(userDetails.id!);
            const resetLink = "http://localhost:8080/reset-password?token=" + accessToken;
            console.log("Reset link ::: ", resetLink);
            logger.info(`Reset link generated for user. Email: ${email}`);

            // Send to notification service
            logger.info(`Reset link sent to notification service. Email: ${email}`);

            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error confirming user. Email: ${email}`, { error });
                throw error;
            } else {
                logger.error(`Unexpected error confirming user. Email: ${email}`, { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* Validate OTP */
    async validateOTP(otp: string, userID: string): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }> {
        logger.info(`Validate OTP request received. UserID: ${userID}`);
        try {
            const otpDetails = await this.authRepository.getOTP(userID);
            if (!otpDetails?.otp || !otpDetails?.expiresAt) {
                logger.warn(`OTP not found. UserID: ${userID}`);
                throw createHttpError(400, "Invalid OTP");
            }

            // Check for OTP expiry
            const currentTime = new Date();
            const otpExpiryTime = new Date(otpDetails.expiresAt);
            if (otpExpiryTime < currentTime) {
                logger.warn(`OTP expired. UserID: ${userID}`);
                throw createHttpError(400, "OTP has expired");
            }

            if (otp !== otpDetails.otp) {
                logger.warn(`Incorrect OTP entered. UserID: ${userID}`);
                throw createHttpError(400, "Invalid OTP");
            }

            logger.info(`OTP validated successfully. UserID: ${userID}`);

            // Fetch basic profile details
            const basicUserProfile = await this.authRepository.getBasicProfile(userID);
            logger.info(`Basic profile fetched for user. UserID: ${userID}`);

            // Generate tokens
            const accessToken = signAccessToken(otpDetails.userID);
            const refreshToken = signRefreshToken(otpDetails.userID);
            logger.info(`Tokens generated for user. UserID: ${userID}`);

            await redisHelper.set(`RefreshToken:${otpDetails.userID!}`, refreshToken, 7 * 24 * 60 * 60); //store in redis for seven days
            logger.info("Stored refresh token in redis cache for the user: ", otpDetails.userID);

            return { accessToken, refreshToken, username: basicUserProfile.username, profilePicture: basicUserProfile.profilePicture };
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error validating OTP. UserID: ${userID}`, { error });
                throw error;
            } else {
                logger.error(`Unexpected error validating OTP. UserID: ${userID}`, { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* Resend OTP */
    async resendOtp(userID: string): Promise<boolean> {
        logger.info(`Resend OTP request received. UserID: ${userID}`);
        await this.generateAndStoreOtp(userID);
        logger.info(`OTP resent to user. UserID: ${userID}`);
        return true;
    }

    /* Reset password */
    async resetPassword(userID: string, password: string): Promise<boolean> {
        logger.info(`Reset password request received. UserID: ${userID}`);
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            logger.info(`Password hashed for user. UserID: ${userID}`);
            await this.authRepository.resetPassword(userID, hashedPassword);
            logger.info(`Password reset successfully. UserID: ${userID}`);
            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error resetting password. UserID: ${userID}`, { error });
                throw error;
            } else {
                logger.error(`Unexpected error resetting password. UserID: ${userID}`, { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* Generate and store OTP */
    async generateAndStoreOtp(userID: string): Promise<boolean> {
        logger.info(`Generating OTP for user. UserID: ${userID}`);
        try {
            const otp = generateOtp();
            logger.info(`OTP generated for user. UserID: ${userID}`);
            console.log("OTP generated :::", otp);

            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + Number(process.env.OTP_EXPIRATION_MINUTES));
            await this.authRepository.saveOTP({ userID, otp, expiresAt });
            logger.info(`OTP stored for user. UserID: ${userID}`);

            return true;
        } catch (error) {
            logger.error(`Error generating and storing OTP. UserID: ${userID}`, { error });
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* OAuth signup */
    async ouathSignup(email: string, picture: string, name: string, provider: string): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }> {
        logger.info(`OAuth signup request received. Email: ${email}, Provider: ${provider}`);
        try {
            let userDetails = await this.authRepository.findByEmail(email);

            if (!userDetails) {
                logger.info(`Signing up new user via OAuth. Email: ${email}, Provider: ${provider}`);
                const resp = await this.authRepository.saveOauthUser(email, provider, name, picture);

                const accessToken = signAccessToken(resp.id!);
                const refreshToken = signRefreshToken(resp.id!);
                logger.info(`Tokens generated for new OAuth user. Email: ${email}`);

                await redisHelper.set(`RefreshToken:${resp.id!!}`, refreshToken, 7 * 24 * 60 * 60); //store in redis for seven days
                logger.info("Stored refresh token in redis cache for the user: ", resp.id!);

                return { accessToken, refreshToken, username: name, profilePicture: picture };
            } else {
                if (userDetails.provider === provider) {
                    logger.info(`Existing user signing in via OAuth. Email: ${email}`);
                    const accessToken = signAccessToken(userDetails.id!);
                    const refreshToken = signRefreshToken(userDetails.id!);
                    logger.info(`Tokens generated for existing OAuth user. Email: ${email}`);

                    await redisHelper.set(`RefreshToken:${userDetails.id!}`, refreshToken, 7 * 24 * 60 * 60); //store in redis for seven days
                    logger.info("Stored refresh token in redis cache for the user: ", userDetails.id);

                    const basicUserProfile = await this.authRepository.getBasicProfile(userDetails.id!);
                    return { accessToken, refreshToken, username: basicUserProfile.username, profilePicture: basicUserProfile.profilePicture };
                } else {
                    logger.warn(`User used a different authentication provider. Email: ${email}`);
                    throw new Error("Try other signin methods");
                }
            }
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error in OAuth signup. Email: ${email}`, { error });
                throw error;
            } else {
                logger.error(`Unexpected error in OAuth signup. Email: ${email}`, { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* generate new access and refresh token on token expiration */
    async generateNewTokens(userID: string): Promise<{accessToken: string, refreshToken: string}>{
        try {
            logger.info(`Generating new access and refresh tokens for ${userID}`);
            const accessToken = signAccessToken(userID);
            const refreshToken = signRefreshToken(userID);
            logger.info(`Generated new access and refresh tokens for ${userID}`);
            await redisHelper.set(`RefreshToken:${userID}`, refreshToken, 7 * 24 * 60 * 60); //store in redis for seven days
            logger.info("Stored refresh token in redis cache for the user: ", userID);
            return { accessToken, refreshToken };
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`Error in generateNewTokens. Email: ${userID}`, { error });
                throw error;
            } else {
                logger.error(`Unexpected error in generateNewTokens. Email: ${userID}`, { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }
}

export default AuthService;