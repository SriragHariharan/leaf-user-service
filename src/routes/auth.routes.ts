import { NextFunction, Request, Response, Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthService from "../services/auth.service";
import AuthRepository from "../repository/auth.repository";
import UsernameRepository from "../repository/profile.repository";

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

authRouter.post("/login", authController.loginUser);

authRouter.get("/confirm-email", authController.confirmEmail);

authRouter.post("/confirm-otp", authController.confirmOTP);

authRouter.post("/reset-password", authController.resetPassword);

authRouter.post("/resend-otp", authController.resendOtp)

export default authRouter;
