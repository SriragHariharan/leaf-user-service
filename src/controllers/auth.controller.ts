import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth.service';
import createHttpError from 'http-errors';

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
                .json({ success: true, message: "User signup successful", data: {} });
        } catch (error) {
            console.error("Controller Error :::", error);
            next(error);
        }
    }

    async loginUser(req: Request, res: Response, next: NextFunction){};

    async confirmEmail(req: Request, res: Response, next: NextFunction){};

    async confirmOTP(req: Request, res: Response, next: NextFunction){};

    async resetPassword(req: Request, res: Response, next: NextFunction){};

    async resendOtp(req: Request, res: Response, next: NextFunction){};

}

export default AuthController;