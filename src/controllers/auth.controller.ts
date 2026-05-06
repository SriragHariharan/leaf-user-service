import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { Auth } from '../interfaces/auth.interface';
import logger from '../helpers/logger';
import { IAuthService } from '../interfaces/IAuthService';
import redisHelper from '../helpers/redis.helper';

class AuthController {
    private authService: IAuthService;

    // Inject AuthService into the controller
    constructor(authService: IAuthService) {
        this.authService = authService;
    }

    /* Signup user */
    async signupUser(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering signupUser method. Endpoint: ${req.path}, Method: ${req.method}`, { method: "signupUser", layer: "controller" });
        try {
            logger.info(`Signup request received. Endpoint: ${req.path}, Method: ${req.method}, Email: ${req.body.email}`, { layer: "controller" });
            const { email, username, password } = req.body;

            // Validate required fields
            if (!email || !username || !password) {
                const missingFields = ['email', 'username', 'password'].filter(field => !req.body[field]);
                logger.warn(`Signup validation failed. Missing fields: ${missingFields.join(', ')}`, { email: email || '[NOT PROVIDED]', layer: "controller" });
                throw createHttpError(400, "Invalid user credentials");
            }

            logger.info(`Creating new user. Email: ${email}`, { layer: "controller" });
            const userID = await this.authService.createNewUser(req.body);
            logger.info(`User created successfully. UserID: ${userID}, Email: ${email}`, { layer: "controller" });

            return res.status(201).json({ success: true, message: "User signup successful", data: { userID } });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in signupUser method. Email: ${req.body.email}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    layer: "controller"
                });
            } else {
                logger.error(`Unexpected error in signupUser method. Email: ${req.body.email}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    layer: "controller"
                });
            }
            next(error);
        } finally {
            logger.debug(`Exiting signupUser method. Endpoint: ${req.path}`, { method: "signupUser", layer: "controller" });
        }
    }

    /* Login user */
    async loginUser(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering loginUser method. Endpoint: ${req.path}, Method: ${req.method}`, { method: "loginUser", layer: "controller" });
        try {
            logger.info(`Login request received. Email: ${req.body.email}`, { layer: "controller" });
            const { email, password }: Auth = req.body;

            if (!email || !password) {
                logger.warn(`Missing login credentials. Email: ${email || '[NOT PROVIDED]'}`, { layer: "controller" });
                throw createHttpError(400, "Invalid user credentials");
            }

            const response = await this.authService.loginUser({ email, password });
            logger.info(`User login successful. Email: ${email}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Login successful", data: { ...response } });
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in loginUser method. Email: ${req.body.email}`, {
                    message: error.message,
                    stack: error.stack,
                    endpoint: req.path,
                    method: req.method,
                    layer: "controller"
                });
            } else {
                logger.error(`Unexpected error in loginUser method. Email: ${req.body.email}`, {
                    error: JSON.stringify(error),
                    endpoint: req.path,
                    method: req.method,
                    layer: "controller"
                });
            }
            next(error);
        } finally {
            logger.debug(`Exiting loginUser method. Endpoint: ${req.path}`, { method: "loginUser", layer: "controller" });
        }
    }

    /* Confirm email */
    async confirmEmail(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering confirmEmail method. Email: ${req.body.email}`, { method: "confirmEmail", layer: "controller" });
        try {
            logger.info(`Confirm email request received. Email: ${req.body.email}`, { layer: "controller" });
            const { email } = req.body;

            if (!email) {
                logger.warn(`Email not provided. Email: ${req.body.email || '[NOT PROVIDED]'}`, { layer: "controller" });
                throw createHttpError(400, "Invalid user credentials");
            }

            logger.info(`Calling confirmUser service. Email: ${email}`, { layer: "controller" });
            await this.authService.confirmUser(email);
            logger.info(`Email confirmed successfully. Email: ${email}`, { layer: "controller" });

            return res.status(201).json({ success: true, message: "A password reset link has been shared to your email.", data: {} });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in confirmEmail. Email: ${req.body.email}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in confirmEmail. Email: ${req.body.email}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting confirmEmail method. Email: ${req.body.email}`, { method: "confirmEmail", layer: "controller" });
        }
    }

    /* Confirm OTP */
    async confirmOTP(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering confirmOTP method. UserID: ${req.body.userID}`, { method: "confirmOTP", layer: "controller" });
        try {
            const { otp, userID } = req.body;
            logger.info(`Confirm OTP request received. UserID: ${userID}`, { layer: "controller" });

            if (!otp) {
                logger.warn(`Invalid OTP entered. UserID: ${userID}`, { layer: "controller" });
                throw createHttpError(400, "Invalid OTP");
            }
            if (!userID) {
                logger.error(`UserID not provided in request. UserID: ${userID || '[NOT PROVIDED]'}`, { layer: "controller" });
                throw createHttpError(500, "Something went wrong, try again after sometime");
            }

            logger.info(`Calling validateOTP service. UserID: ${userID}`, { layer: "controller" });
            const userDetails = await this.authService.validateOTP(otp, userID);
            logger.info(`OTP validated successfully. UserID: ${userID}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "OTP validated", data: { ...userDetails } });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in confirmOTP. UserID: ${req.body.userID}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in confirmOTP. UserID: ${req.body.userID}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting confirmOTP method. UserID: ${req.body.userID}`, { method: "confirmOTP", layer: "controller" });
        }
    }

    /* Reset Password */
    async resetPassword(req: Request, res: Response, next: NextFunction) {
        const userID = req.user?.aud;
        logger.debug(`Entering resetPassword method. UserID: ${userID}`, { method: "resetPassword", layer: "controller" });
        try {
            logger.info(`Reset password request received. UserID: ${userID}`, { layer: "controller" });
            const { password, confirmPassword } = req.body;

            if (password !== confirmPassword) {
                logger.warn(`Password mismatch. UserID: ${userID}`, { layer: "controller" });
                throw createHttpError(400, "Passwords mismatch");
            }

            logger.info(`Calling resetPassword service. UserID: ${userID}`, { layer: "controller" });
            await this.authService.resetPassword(userID, password);
            logger.info(`Password reset successfully. UserID: ${userID}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Password reset successful, Login to continue.", data: {} });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in resetPassword. UserID: ${userID}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in resetPassword. UserID: ${userID}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting resetPassword method. UserID: ${userID}`, { method: "resetPassword", layer: "controller" });
        }
    }


    /* Resend OTP */
    async resendOtp(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering resendOtp method. UserID: ${req.body.userID}`, { method: "resendOtp", layer: "controller" });
        try {
            const userID = req.body.userID;
            logger.info(`Resend OTP request received. UserID: ${userID}`, { layer: "controller" });

            if (!userID) {
                logger.warn(`UserID not provided in request. UserID: ${userID || '[NOT PROVIDED]'}`, { layer: "controller" });
                throw createHttpError(403, "Unauthorized request");
            }

            logger.info(`Calling resendOtp service. UserID: ${userID}`, { layer: "controller" });
            await this.authService.resendOtp(userID);
            logger.info(`OTP resent successfully. UserID: ${userID}`, { layer: "controller" });

            return res.status(201).json({ success: true, message: "OTP resent", data: {} });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in resendOtp. UserID: ${req.body.userID}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in resendOtp. UserID: ${req.body.userID}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting resendOtp method. UserID: ${req.body.userID}`, { method: "resendOtp", layer: "controller" });
        }
    }


    /* OAuth signup */
    async oAuthSignup(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering oAuthSignup method. Email: ${req.body.email}, Provider: ${req.body.provider}`, { method: "oAuthSignup", layer: "controller" });
        try {
            const { email, name, picture, provider } = req.body;
            logger.info(`OAuth signup request received. Email: ${email}, Provider: ${provider}`, { layer: "controller" });

            if (!email) {
                logger.warn(`Email not found in request body. Email: ${email || '[NOT PROVIDED]'}`, { layer: "controller" });
                throw createHttpError(400, "Email not found");
            }

            logger.info(`Calling ouathSignup service. Email: ${email}`, { layer: "controller" });
            const response = await this.authService.ouathSignup(email, picture, name, provider);
            logger.info(`OAuth signup successful. Email: ${email}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Login successful", data: { ...response } });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in oAuthSignup. Email: ${req.body.email}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in oAuthSignup. Email: ${req.body.email}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting oAuthSignup method. Email: ${req.body.email}`, { method: "oAuthSignup", layer: "controller" });
        }
    }


    async generateNewAccessAndRefreshToken(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering generateNewAccessAndRefreshToken method. User: ${req.user?.aud}`, { method: "generateNewAccessAndRefreshToken", layer: "controller" });
        try {
            logger.info(`Request received to generate new access and refresh token for the user: ${req.user?.aud}`, { layer: "controller" });

            logger.info(`Calling generateNewTokens service. User: ${req.user?.aud}`, { layer: "controller" });
            let tokens = await this.authService.generateNewTokens(req.user?.aud!);
            logger.info(`Generated new access and refresh token for the user: ${req.user?.aud}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: null, data: { ...tokens } });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in generateNewAccessAndRefreshToken. User: ${req.user?.aud}`, { error, layer: "controller" });
                throw error;
            } else {
                logger.error(`Unexpected error in generateNewAccessAndRefreshToken. User: ${req.user?.aud}`, { error, layer: "controller" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting generateNewAccessAndRefreshToken method. User: ${req.user?.aud}`, { method: "generateNewAccessAndRefreshToken", layer: "controller" });
        }
    }


    async logoutUser(req: Request) {
        logger.debug(`Entering logoutUser method. User: ${req.user?.aud}`, { method: "logoutUser", layer: "controller" });
        try {
            logger.info(`Deleting refresh token from Redis for user: ${req.user?.aud}`, { layer: "controller" });
            await redisHelper.delete(`RefreshToken:${req.user?.aud || null}`);
            logger.info(`Logout completed for user: ${req.user?.aud}`, { layer: "controller" });
        } catch (error) {
            logger.error(`Unexpected error in logoutUser. User: ${req.user?.aud}`, { error, layer: "controller" });
            throw createHttpError(500, "An unexpected error occurred during logout");
        } finally {
            logger.debug(`Exiting logoutUser method. User: ${req.user?.aud}`, { method: "logoutUser", layer: "controller" });
        }
    }

}

export default AuthController;