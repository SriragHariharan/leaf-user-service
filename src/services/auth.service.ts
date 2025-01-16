import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import bcrypt from "bcrypt";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";
import { generateOtp } from "../helpers/otp.helper";
import createHttpError from "http-errors";

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



};

export default AuthService;