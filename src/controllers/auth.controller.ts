import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth.service';
import createHttpError from 'http-errors';
import { Auth } from '../interfaces/auth.interface';
import logger from '../helpers/logger';

class AuthController {
    private authService: AuthService;

    // Inject AuthService into the controller
    constructor(authService: AuthService) {
        this.authService = authService;
    }

    async signupUser(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info('Signup request received', { endpoint: req.path, method: req.method, email: req.body.email });
            const { email, username, password, confirmPassword } = req.body;
            if (!email || !username || !password || !confirmPassword) {
                logger.warn('Signup validation failed: Missing required fields', {
                    email: email || '[NOT PROVIDED]',
                    missingFields: ['email', 'username', 'password', 'confirmPassword'].filter(field => !req.body[field]) 
                });
                throw createHttpError(400, "Invalid user credentials");
            }

            if (password !== confirmPassword) {
                logger.warn('Validation failed: passwords mismatch', { email });
                throw createHttpError(400, "Passwords do not match");
            }

            // Send data to the service layer to perform business logic
            logger.info('Calling authService to create a new user', { email });
            const dataFromService = await this.authService.createNewUser(req.body);
            logger.info('User created successfully in service layer', { details: dataFromService });
            logger.info('Signup process completed successfully', { email });
            
            return res
                .status(201)
                .json({ success: true, message: "User signup successful", data: { userID: dataFromService } });
        } catch (error) {
            if (error instanceof Error) {
                logger.error("Error in signupUser controller :", {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            } else {
                logger.error("Unexpected error in signupUser controller :", {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            }
            next(error);
        }
    }

    async loginUser(req: Request, res: Response, next: NextFunction){
        logger.info("Login request received", { email: req.body.email });
        try {
            let { email, password }: Auth = req.body;
            if(!email || !password){
                logger.warn("missing login credentials: ", { email });
                throw createHttpError(400, "Invalid user credentials");
            }
            //call service layer to check for email existence
            let response = await this.authService.loginUser({email, password});
            logger.info("user login successful: ", { email });
            return res.status(200).json({ success: true, message: "Login successfull", data: { ...response }});
        } catch (error) {
            if (error instanceof Error) {
                logger.error("Error in loginUser controller  :", {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            } else {
                logger.error("Unexpected error in loginUser controller  :", {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            }
            next(error);
        }
    };

    async confirmEmail(req: Request, res: Response, next: NextFunction){
        try {
            logger.info("Call received to confirm email: ", { email: req.body.email} );
            let { email } = req.body;
            if(!email){
                logger.warn("Email not found: ", { email: req.body.email});
                throw createHttpError(400, "Invalid user credentials");
            }
            await this.authService.confirmUser(email);
            logger.info("User with specified email is confirmed: ", { email: email});
            return res.status(201).json({ success: true, message: "A password reset link has been shared to your email. Visit the link to reset the password", data: {}});

        } catch (error) {
            if (error instanceof Error) {
                logger.error("Error in confirmEmail controller:  :", {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            } else {
                logger.error("Unexpected error in confirmEmail controller :", {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            }
            next(error);
        }
    };

    async confirmOTP(req: Request, res: Response, next: NextFunction){
        try {
            console.log(req.body)
            let { otp, userID } = req.body;
            logger.info("Call received in confirmOTP controller for the userID: %s", userID)
            if(!otp){
                logger.warn("Invalid OTP entered by the user: %s", userID)
                throw createHttpError(400, "Invalid OTP");
            }
            if(!userID){
                logger.error("UserID not sent with the request to the serve :r");
                throw createHttpError(500, "Something went wrong, try again after sometime");
            } 
            let userDetails = await this.authService.validateOTP(otp, userID);
            logger.info("OTP validated for the userID: %s", userID)
            return res.status(200).json({ success: true, message: "OTP validated", data: {...userDetails }})

        } catch (error) {
            if (error instanceof Error) {
                logger.error("Error in confirmOTP controller :", {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            } else {
                logger.error("Unexpected error in confirmOTP controller :", {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            }
            next(error);
        }
    };

    async resetPassword(req: Request, res: Response, next: NextFunction){
        try {
            logger.info("Call received in resetPassword controller for the userID: %s", req.user?.aud)
            let { password, confirmPassword } = req.body;
            if(password !== confirmPassword){
                logger.warn("Password mismatch for the userID: %s", req.user?.aud);
                throw createHttpError(400, "Passwords mismatch");
            }
            logger.info("Reset password initiated for the userID: %s", req.user?.aud);
            await this.authService.resetPassword(req.user?.aud, req.body.password);
            logger.info("Reset password successfull for the userID: %s", req.user?.aud);
            return res.status(200).json({ success: true, message: "Password reset successfull, Login to continue.", data: {} })
        } catch (error) {
            if (error instanceof Error) {
                logger.error("Error in resetPasword controller :", {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            } else {
                logger.error("Unexpected error in resetPasword controller :", {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            }
            next(error);
        }
    };

    async resendOtp(req: Request, res: Response, next: NextFunction){
        try {
            logger.info("Call recieved in resendOTP controller for userID: ", req.user.id);
            const userID = req.body.userID;
            if(!userID){
                logger.error("UserID not provided in request :");
                throw createHttpError(403, "Unautorized request");
            }
            await this.authService.resendOtp(userID);
            logger.info("New OTP resend to the userID: ", userID);
            return res.status(201).json({ success: true, message: "OTP resent", data: {} })
        } catch (error) {
            if (error instanceof Error) {
                logger.error("Error in resendPassword controller :", {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            } else {
                logger.error("Unexpected error in resendPassword controller :", {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            }
            next(error);
        }
    };

    async oAuthSignup(req: Request, res: Response, next: NextFunction){
        try {
            logger.info("Call recieved in oAuthSignup controller for userID: ", req.user.id);
            let { email, name, picture, provider } = req.body;
            if(!email) {
                logger.warn("Email not found in request body during OAuth signup");
                throw createHttpError(400, "Email not found");
            }
            let response = await this.authService.ouathSignup(email, picture, name, provider)
            logger.info("Oauth signup successful for userID: ", req.user.id);
            return res.status(200).json({ success: true, message: "Login successfull", data: { ...response }});
        } catch (error) {
            if (error instanceof Error) {
                logger.error("Error in oAuthSignup controller :", {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            } else {
                logger.error("Unexpected error in oAuthSignup controller :", {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    email: req.body.email,
                });
            }
            next(error);
        }
    }

}

export default AuthController;