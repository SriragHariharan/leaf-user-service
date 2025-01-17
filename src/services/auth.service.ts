import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import bcrypt from "bcrypt";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";
import { generateOtp } from "../helpers/otp.helper";
import createHttpError from "http-errors";
import { signAccessToken, signRefreshToken } from "../helpers/jwt.helper";

class AuthService{

    private authRepository: IAuthRepository;
    private usernameRepository: IUsernameRepository;

    constructor(authRepository: IAuthRepository, usernameRepository: IUsernameRepository) {
        this.authRepository = authRepository;
        this.usernameRepository = usernameRepository;
    }

    /*create user account*/
    async createNewUser(authDetails: Auth): Promise<boolean> {
        console.log(authDetails, " to repo");
        try {
            // Check if user already exists in the database
            const userExists = await this.authRepository.findByEmail(authDetails?.email!);
            if (userExists) {
                console.log("User already exists...");
                throw createHttpError(409, "User already exists"); // HTTP 409 Conflict
            }

            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(authDetails?.password!, 10);

            // Save the user with the hashed password
            authDetails.password = hashedPassword;
            const user = await this.authRepository.create(authDetails);
            console.log("User created successfully:", user);

            // Update username in the profile database
            await this.usernameRepository.updateUsername(user?.id!, authDetails?.username!);
            console.log("Updated username in profile table");

            // Generate OTP and store it in the OTP table
            const otp = generateOtp();
            console.log("OTP generated :::", otp);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 3);
            await this.authRepository.saveOTP({ userID: user?.id!, otp, expiresAt });

            // Send OTP to notification service (e.g., via email or SMS)
            console.log("Sending OTP to the notification service");

            return true;
        } catch (error) {
            // Use http-errors to standardize unexpected errors
            if (createHttpError.isHttpError(error)) {
                console.error("HTTP Error in createNewUser:", error.message);
                throw error; // Re-throw known HTTP errors
            } else {
                console.error("Unexpected error:", error);
                throw createHttpError(500, "An unexpected error occurred"); // HTTP 500 Internal Server Error
            }
        }
    }

    async loginUser(authDetails: Auth): Promise<Object> {
        try {
            //check if user exists or not
            let userDetails = await this.authRepository.findByEmail(authDetails?.email!);
            console.log("user details ::: ", userDetails);
            //if user exists then validate password
            if(!userDetails){
                throw createHttpError(401, "Invalid user credentials");
            }
            let passwordHashResult = await bcrypt.compare(authDetails?.password!, userDetails?.password!);
            if(!passwordHashResult){
                throw createHttpError(401, "Invalid user credentials");
            }
            //create a jwt and return it
            const accessToken = signAccessToken(userDetails?.id!);
            const refreshToken = signRefreshToken(userDetails?.id!);
            console.log(accessToken, refreshToken, " ::: axt rft")
            
            /* get username and dp and attach with it and send in future */
            return { accessToken, refreshToken };
            
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                console.error("HTTP Error in createNewUser:", error.message);
                throw error; // Re-throw known HTTP errors
            } else {
                console.error("Unexpected error:", error);
                throw createHttpError(500, "An unexpected error occurred"); // HTTP 500 Internal Server Error
            }
        }
    }

    async confirmUser(email: string): Promise<string>{
        try {
            let userDetails = await this.authRepository.findByEmail(email);
            console.log(userDetails)
            if(!userDetails){
                throw createHttpError(401, "Invalid email credentials");
            }
            //generate otp and update in otp table
            // Generate OTP and store it in the OTP table
            const otp = generateOtp();
            console.log("OTP generated :::", otp);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 3);
            await this.authRepository.saveOTP({ userID: userDetails?.id!, otp, expiresAt });

            return userDetails?.id!;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                console.error("HTTP Error in createNewUser:", error.message);
                throw error; // Re-throw known HTTP errors
            } else {
                console.error("Unexpected error:", error);
                throw createHttpError(500, "An unexpected error occurred"); // HTTP 500 Internal Server Error
            }
        }
    }

    async validateOTP(otp: string, userID: string): Promise<string>{
        try {
            let otpDetails = await this.authRepository.getOTP(userID);
            console.log(otpDetails);
            if(!otpDetails?.otp || !otpDetails?.expiresAt){
                throw createHttpError(400, "Invalid OTP");
            }
            //check for otp expiry
            const currentTime = new Date();
            const otpExpiryTime = new Date(otpDetails.expiresAt);
            if (otpExpiryTime < currentTime) {
                throw createHttpError(400, "OTP has expired");
            } else {
                console.log("OTP is still valid", otp, otpDetails?.otp);
                if(otp != otpDetails?.otp){
                    console.log("incorrect otp")
                    throw createHttpError(400, "Invalid OTP");
                }else{
                    let accessToken = signAccessToken(otpDetails?.userID!);
                    return accessToken;
                }
            }

        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                console.error("HTTP Error in createNewUser:", error.message);
                throw error; // Re-throw known HTTP errors
            } else {
                console.error("Unexpected error:", error);
                throw createHttpError(500, "An unexpected error occurred"); // HTTP 500 Internal Server Error
            }
        }
    }



};

export default AuthService;