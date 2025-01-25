import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import bcrypt from "bcrypt";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";
import { generateOtp } from "../helpers/otp.helper";
import createHttpError from "http-errors";
import { signAccessToken, signRefreshToken } from "../helpers/jwt.helper";
import logger from "../helpers/logger";

class AuthService{

    private authRepository: IAuthRepository;
    private usernameRepository: IUsernameRepository;

    constructor(authRepository: IAuthRepository, usernameRepository: IUsernameRepository) {
        this.authRepository = authRepository;
        this.usernameRepository = usernameRepository;
    }

    /*create user account*/
    async createNewUser(authDetails: Auth): Promise<string> {
        logger.info("createNewUser service called with email: %s", authDetails.email);
        try {
            // Check if user already exists in the database
            const userExists = await this.authRepository.findByEmail(authDetails?.email!);
            if (userExists) {
                logger.warn("User already exists in the database: %s", authDetails.email);
                throw createHttpError(409, "User already exists"); // HTTP 409 Conflict
            }

            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(authDetails?.password!, 10);
            logger.info("Password hashed for the user: %s", authDetails?.email);

            // Save the user with the hashed password
            authDetails.password = hashedPassword;
            const user = await this.authRepository.create(authDetails);
            logger.info("User created: %s", user?.id)

            // Update username in the profile database
            await this.usernameRepository.updateUsername(user?.id!, authDetails?.username!);
            logger.info("Username updated in the profile database: %s", user?.id)

            // Generate OTP and store it in the OTP table
            await this.generateAndStoreOtp(user?.id!);
            logger.info("Unique OTP generated for user: %s", user?.id);

            // Send OTP to notification service (e.g., via email or SMS)
            console.log("Sending OTP to the notification service");

            return user?.id!;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error("Error in createNewUser: %s", error.message, { error });
                throw error;
            } else {
                logger.error("Unexpected error in createNewUser", { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* login existing user */
    async loginUser(authDetails: Auth): Promise<{accessToken: string, refreshToken: string, username: string, profilePicture: string|null}> {
        try {
            logger.info("Call recieved in loginUser service", { email: authDetails.email })
            //check if user exists or not
            let userDetails = await this.authRepository.findByEmail(authDetails?.email!);
            
            //if user exists then validate password
            if(!userDetails){
                logger.error("User with email not found in database: %s", { email: authDetails.email });
                throw createHttpError(401, "Invalid user credentials");
            }
            let passwordHashResult = await bcrypt.compare(authDetails?.password!, userDetails?.password!);
            if(!passwordHashResult){
                logger.error("User entered incorrect password: %s", { email: authDetails.email });
                throw createHttpError(401, "Invalid user credentials");
            }
            //create a jwt and return it
            const accessToken = signAccessToken(userDetails?.id!);
            const refreshToken = signRefreshToken(userDetails?.id!);
            console.log(accessToken, refreshToken, " ::: axt rft")
            logger.info("Generated access and refresh token for the user: %s", { email: authDetails.email });

            const basicUserProfile = await this.authRepository.getBasicProfile(userDetails?.id!)
            logger.info("Fetched the basic profile details of the user: %s", { email: authDetails.email })
            /* get username and dp and attach with it and send in future */
            return { accessToken, refreshToken, username: basicUserProfile?.username, profilePicture: basicUserProfile?.profilePicture };
            
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error("Error in loginUser service: %s", error.message, { error });
                throw error;
            } else {
                logger.error("Unexpected error in loginUser service", { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* Confirm whether user is found in db or not */
    async confirmUser(email: string): Promise<boolean>{
        try {
            logger.info("Call received in confirmUser service: %s", email);
            let userDetails = await this.authRepository.findByEmail(email);
            console.log(userDetails)
            if(!userDetails){
                logger.warn("User with email not found in database: %s", { email });
                throw createHttpError(401, "Invalid email credentials");
            }

            // Generate reset link
            logger.info("Generating password reset link: %s", { email });
            const accessToken = signAccessToken(userDetails?.id!);
            const resetLink = "http://localhost:8080/reset-password?token=" + accessToken;
            console.log("reset link ::: ", resetLink);
            logger.info("Password reset link generated for the user: %s", { email });

            //send to notification service
            logger.info("Reset link sent the notification service: %s", { email });

            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error("Error in confirmUser Service: %s", error.message, { error });
                throw error;
            } else {
                logger.error("Unexpected error in confirmUser Service: %s", { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* Validate the otp after confirm email page */
    async validateOTP(otp: string, userID: string): Promise<{accessToken: string, refreshToken: string, username: string, profilePicture: string|null}>{
        try {
            logger.info("Call received in the  validateOTP service for user %s" + userID);
            let otpDetails = await this.authRepository.getOTP(userID);

            if(!otpDetails?.otp || !otpDetails?.expiresAt){
                logger.warn("OTP not found in the database for user %s", userID);
                throw createHttpError(400, "Invalid OTP");
            }
            //check for otp expiry
            const currentTime = new Date();
            const otpExpiryTime = new Date(otpDetails.expiresAt);
            if (otpExpiryTime < currentTime) {
                logger.warn("OTP expired for the user with userID: %s", userID);
                throw createHttpError(400, "OTP has expired");
            } else {
                if(otp != otpDetails?.otp){
                    logger.warn("Wrong OTP enterd by the user with userID: %s", userID);
                    throw createHttpError(400, "Invalid OTP");
                }else{
                    logger.info("OTP valid for the user with userID: %s", userID);
                    const basicUserProfile = await this.authRepository.getBasicProfile(userID)
                    logger.info("Basic profile fetched for the user with userID: %s", userID);
                    let accessToken = signAccessToken(otpDetails?.userID!);
                    let refreshToken = signRefreshToken(otpDetails?.userID!);
                    logger.info("Access and refresh token fetched for the user with userID: %s", userID)
                    return {accessToken, refreshToken, username: basicUserProfile?.username, profilePicture: basicUserProfile?.profilePicture};
                }
            }
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error("Error in validateOTP service: %s", error.message, { error });
                throw error;
            } else {
                logger.error("Unexpected error in validateOTP service: %s", { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* resend otp on timer expiry */
    async resendOtp(userID: string): Promise<boolean> {
        logger.info("Call received in resendOTP service for userID: %s", userID);
        await this.generateAndStoreOtp(userID);
        // ❌collect the regenerated otp and send to notification service❌
        logger.info("OTP resent to theu userID's email: %s", userID);
        return true;
    }

    /* reset password */
    async resetPassword(userID: string, password: string): Promise<boolean>{
        try {
            logger.info("Call received in the userController to reset password for user: %s" + userID);
            logger.info("Hashing the pasword for user: %s" + userID);
            let hashedPassword = await bcrypt.hash(password, 10)
            logger.info("Password hashing successfull for user: %s" + userID);
            await this.authRepository.resetPassword(userID, hashedPassword);
            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error("Error in resetPassword service: %s", error.message, { error });
                throw error;
            } else {
                logger.error("Unexpected error in resetPassword service: %s", { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* Generate otp and store in OTP table */
    async generateAndStoreOtp(userID: string): Promise<boolean> {
        try {
            logger.info("generating otp for user " + userID);
            const otp = generateOtp();
            logger.info("OTP generated for user " + userID);
            console.log("OTP generated :::", otp);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + Number(process.env.OTP_EXPIRATION_MINUTES));
            await this.authRepository.saveOTP({ userID, otp, expiresAt });
            return true;
        } catch (error) {
            logger.error("Error generating and storing otp for userID: %s Error %s", userID,  error);
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* signup user via oauth: Google, fb, twitter etc... */
    async ouathSignup(email: string, picture: string, name: string, provider: string): Promise<{accessToken: string, refreshToken: string, username: string, profilePicture: string | null}> {
        try {
            logger.info("Call recieved in OAuthSignup service to signup user %s", email);
            let userDetails = await this.authRepository.findByEmail(email!);
            
            //if not user, add a new one
            if(!userDetails){
                logger.info("Signing up new user via oAuth: email %s provider %s ", email, provider);
                let resp = await this.authRepository.saveOauthUser(email, provider, name, picture);
                
                logger.info("Generating access and refresh token for the new user: ", email );
                const accessToken = signAccessToken(resp?.id!)
                const refreshToken = signRefreshToken(resp?.id!)
                logger.info("Generated access and refresh token for the new user: ", email );
                //attach username and image from profile service and send
                return { accessToken, refreshToken, username: name, profilePicture: picture};
            }
            else{
                if(userDetails?.provider === provider){
                    logger.info("Signup existing user signup via Oauth with email: ",email);
                    const accessToken = signAccessToken(userDetails?.id!)
                    const refreshToken = signRefreshToken(userDetails?.id!)
                    logger.info("Generated access token and refresh token for the user: ",email);
                    const basicUserProfile = await this.authRepository.getBasicProfile(userDetails?.id!);
                    return { accessToken, refreshToken, username: basicUserProfile?.username, profilePicture: basicUserProfile?.profilePicture };
                }else{
                    logger.warn("User used some other authentication provider: ", email);
                    throw new Error("Try other signin methods")
                }
            }
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error("Error in oAuthSignup service: %s", error.message, { error });
                throw error;
            } else {
                logger.error("Unexpected error in oAuthSignup service: %s", { error });
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }
};

export default AuthService;