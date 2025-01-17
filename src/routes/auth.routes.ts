import { NextFunction, Request, Response, Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthService from "../services/auth.service";
import AuthRepository from "../repository/auth.repository";
import UsernameRepository from "../repository/profile.repository";
import { validateAccessToken } from "../helpers/jwt.helper";

const authRouter = Router();

//Instantiate the AuthRepository
const authRepository = new AuthRepository();
const usernameRepository = new UsernameRepository();

// Now inject the AuthRepository into the AuthService
const authService = new AuthService(authRepository, usernameRepository);

// Inject the AuthService into the AuthController
const authController = new AuthController(authService);

authRouter.post("/signup", (req: Request, res: Response, next: NextFunction) => {
    authController.signupUser(req, res, next)
});

authRouter.post("/login", (req: Request, res: Response, next: NextFunction) => {
    authController.loginUser(req, res, next)
});

authRouter.post("/confirm-email", (req: Request, res: Response, next: NextFunction) => {
    authController.confirmEmail(req, res, next)
});


authRouter.post("/confirm-otp", (req: Request, res: Response, next: NextFunction) => {
    authController.confirmOTP(req, res, next)
});

authRouter.post("/reset-password", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    authController.resetPassword(req, res, next)
});

authRouter.post("/resend-otp", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    authController.resendOtp(req, res, next)
});

export default authRouter;
