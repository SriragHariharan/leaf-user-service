import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth.service';
import createHttpError from 'http-errors';
import { Auth } from '../interfaces/auth.interface';

class AuthController {
    private authService: AuthService;

    // Inject AuthService into the controller
    constructor(authService: AuthService) {
        this.authService = authService;
    }

    async signupUser(req: Request, res: Response, next: NextFunction) {
        try {
            // Validate user input
            const { email, username, password, confirmPassword } = req.body;
            if (!email || !username || !password || !confirmPassword) {
                throw createHttpError(400, "Invalid user credentials");
            }

            if (password !== confirmPassword) {
                throw createHttpError(400, "Passwords do not match");
            }

            // Send data to the service layer to perform business logic
            const dataFromService = await this.authService.createNewUser(req.body);
            console.log(dataFromService, " ::: data from service");

            // Alter and return the response back to the user
            return res
                .status(201)
                .json({ success: true, message: "User signup successful", data: { userID: dataFromService } });
        } catch (error) {
            console.error("Controller Error :::", error);
            next(error);
        }
    }

    async loginUser(req: Request, res: Response, next: NextFunction){
        console.log(req.body, "   req body")
        try {
            let { email, password }: Auth = req.body;
            if(!email || !password){
                throw createHttpError(400, "Invalid user credentials");
            }
            //call service layer to check for email existence
            let response = await this.authService.loginUser({email, password});
            return res.status(200).json({ success: true, message: "Login successfull", data: { ...response }});
        } catch (error) {
            console.log("login controller error ::: ", error)
            next(error);
        }
    };

    async confirmEmail(req: Request, res: Response, next: NextFunction){
        try {
            let { email } = req.body;
            if(!email){
                throw createHttpError(400, "Invalid user credentials");
            }
            await this.authService.confirmUser(email);
            return res.status(201).json({ success: true, message: "A password reset link has been shared to your email. Visit the link to reset the password", data: {}});

        } catch (error) {
            console.log("confirm email controller error ::: ", error);
            next(error);
        }
    };

    async confirmOTP(req: Request, res: Response, next: NextFunction){
        try {
            console.log(req.body)
            let { otp, userID } = req.body;
            if(!otp){
                throw createHttpError(400, "Invalid OTP");
            }
            if(!userID){
                throw createHttpError(500, "Something went wrong, try again after sometime");
            } 
            let otpDetails = await this.authService.validateOTP(otp, userID);
            return res.status(200).json({ success: true, message: "OTP validated", data: { token: otpDetails }})

        } catch (error) {
            next(error);
        }
    };

    async resetPassword(req: Request, res: Response, next: NextFunction){
        try {
            let { password, confirmPassword } = req.body;
            if(password !== confirmPassword){
                throw createHttpError(400, "Passwords mismatch");
            }
            await this.authService.resetPassword(req.user?.aud, req.body.password);
            return res.status(200).json({ success: true, message: "Password reset successfull, Login to continue.", data: {} })
        } catch (error) {
            next(error);
        }
    };

    async resendOtp(req: Request, res: Response, next: NextFunction){
        try {
            const aud = req.user?.aud!;
            await this.authService.resendOtp(aud!)
            return res.status(201).json({ success: true, message: "OTP resent", data: {} })
        } catch (error) {
            next(error);
        }
    };

}

export default AuthController;