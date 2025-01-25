import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth.service';
import createHttpError from 'http-errors';
import { Auth } from '../interfaces/auth.interface';
import logger from '../helpers/logger';
import { IAuthService } from '../interfaces/IAuthService';

class AuthController {
    private authService: IAuthService;

    // Inject AuthService into the controller
    constructor(authService: IAuthService) {
        this.authService = authService;
    }

    /* Signup user */
    async signupUser(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info(`Signup request received. Endpoint: ${req.path}, Method: ${req.method}, Email: ${req.body.email}`);
            const { email, username, password, confirmPassword } = req.body;

            // Validate required fields
            if (!email || !username || !password || !confirmPassword) {
                const missingFields = ['email', 'username', 'password', 'confirmPassword'].filter(field => !req.body[field]);
                logger.warn(`Signup validation failed. Missing fields: ${missingFields.join(', ')}`, { email: email || '[NOT PROVIDED]' });
                throw createHttpError(400, "Invalid user credentials");
            }

            // Validate password match
            if (password !== confirmPassword) {
                logger.warn(`Password mismatch. Email: ${email}`);
                throw createHttpError(400, "Passwords do not match");
            }

            // Call service layer to create a new user
            logger.info(`Creating new user. Email: ${email}`);
            const userID = await this.authService.createNewUser(req.body);
            logger.info(`User created successfully. UserID: ${userID}, Email: ${email}`);

            return res.status(201).json({ success: true, message: "User signup successful", data: { userID } });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in signupUser controller. Email: ${req.body.email}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                });
            } else {
                logger.error(`Unexpected error in signupUser controller. Email: ${req.body.email}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                });
            }
            next(error);
        }
    }

    /* Login user */
    async loginUser(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info(`Login request received. Email: ${req.body.email}`);
            const { email, password }: Auth = req.body;

            // Validate required fields
            if (!email || !password) {
                logger.warn(`Missing login credentials. Email: ${email || '[NOT PROVIDED]'}`);
                throw createHttpError(400, "Invalid user credentials");
            }

            // Call service layer to authenticate user
            const response = await this.authService.loginUser({ email, password });
            logger.info(`User login successful. Email: ${email}`);

            return res.status(200).json({ success: true, message: "Login successful", data: { ...response } });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in loginUser controller. Email: ${req.body.email}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                });
            } else {
                logger.error(`Unexpected error in loginUser controller. Email: ${req.body.email}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                });
            }
            next(error);
        }
    }

    /* Confirm email */
    async confirmEmail(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info(`Confirm email request received. Email: ${req.body.email}`);
            const { email } = req.body;

            // Validate required fields
            if (!email) {
                logger.warn(`Email not provided. Email: ${req.body.email || '[NOT PROVIDED]'}`);
                throw createHttpError(400, "Invalid user credentials");
            }

            // Call service layer to confirm user
            await this.authService.confirmUser(email);
            logger.info(`Email confirmed successfully. Email: ${email}`);

            return res.status(201).json({ success: true, message: "A password reset link has been shared to your email. Visit the link to reset the password", data: {} });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in confirmEmail controller. Email: ${req.body.email}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                });
            } else {
                logger.error(`Unexpected error in confirmEmail controller. Email: ${req.body.email}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                });
            }
            next(error);
        }
    }

    /* Confirm OTP */
    async confirmOTP(req: Request, res: Response, next: NextFunction) {
        try {
            console.log(req.body); // Preserved console.log
            const { otp, userID } = req.body;
            logger.info(`Confirm OTP request received. UserID: ${userID}`);

            // Validate required fields
            if (!otp) {
                logger.warn(`Invalid OTP entered. UserID: ${userID}`);
                throw createHttpError(400, "Invalid OTP");
            }
            if (!userID) {
                logger.error(`UserID not provided in request. UserID: ${userID || '[NOT PROVIDED]'}`);
                throw createHttpError(500, "Something went wrong, try again after sometime");
            }

            // Call service layer to validate OTP
            const userDetails = await this.authService.validateOTP(otp, userID);
            logger.info(`OTP validated successfully. UserID: ${userID}`);

            return res.status(200).json({ success: true, message: "OTP validated", data: { ...userDetails } });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in confirmOTP controller. UserID: ${req.body.userID}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                });
            } else {
                logger.error(`Unexpected error in confirmOTP controller. UserID: ${req.body.userID}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                });
            }
            next(error);
        }
    }

    /* Reset password */
    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req.user?.aud;
            logger.info(`Reset password request received. UserID: ${userID}`);

            const { password, confirmPassword } = req.body;

            // Validate password match
            if (password !== confirmPassword) {
                logger.warn(`Password mismatch. UserID: ${userID}`);
                throw createHttpError(400, "Passwords mismatch");
            }

            // Call service layer to reset password
            await this.authService.resetPassword(userID, password);
            logger.info(`Password reset successfully. UserID: ${userID}`);

            return res.status(200).json({ success: true, message: "Password reset successful, Login to continue.", data: {} });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in resetPassword controller. UserID: ${req.user?.aud}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                });
            } else {
                logger.error(`Unexpected error in resetPassword controller. UserID: ${req.user?.aud}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                });
            }
            next(error);
        }
    }

    /* Resend OTP */
    async resendOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req.body.userID;
            logger.info(`Resend OTP request received. UserID: ${userID}`);

            // Validate required fields
            if (!userID) {
                logger.error(`UserID not provided in request. UserID: ${userID || '[NOT PROVIDED]'}`);
                throw createHttpError(403, "Unauthorized request");
            }

            // Call service layer to resend OTP
            await this.authService.resendOtp(userID);
            logger.info(`OTP resent successfully. UserID: ${userID}`);

            return res.status(201).json({ success: true, message: "OTP resent", data: {} });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in resendOtp controller. UserID: ${req.body.userID}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                });
            } else {
                logger.error(`Unexpected error in resendOtp controller. UserID: ${req.body.userID}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                });
            }
            next(error);
        }
    }

    /* OAuth signup */
    async oAuthSignup(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, name, picture, provider } = req.body;
            logger.info(`OAuth signup request received. Email: ${email}, Provider: ${provider}`);

            // Validate required fields
            if (!email) {
                logger.warn(`Email not found in request body. Email: ${email || '[NOT PROVIDED]'}`);
                throw createHttpError(400, "Email not found");
            }

            // Call service layer to handle OAuth signup
            const response = await this.authService.ouathSignup(email, picture, name, provider);
            logger.info(`OAuth signup successful. Email: ${email}`);

            return res.status(200).json({ success: true, message: "Login successful", data: { ...response } });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in oAuthSignup controller. Email: ${req.body.email}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                });
            } else {
                logger.error(`Unexpected error in oAuthSignup controller. Email: ${req.body.email}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                });
            }
            next(error);
        }
    }
}

export default AuthController;