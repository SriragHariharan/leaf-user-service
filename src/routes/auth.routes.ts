import { NextFunction, Request, Response, Router } from "express";
import AuthController from "../controllers/auth.controller";
import UserService from "../services/auth.service";
import AuthRepository from "../repository/auth.repository";

const authRouter = Router();

//Instantiate the AuthRepository
const authRepository = new AuthRepository();

// Now inject the AuthRepository into the UserService
const userService = new UserService(authRepository);

// Inject the UserService into the AuthController
const authController = new AuthController(userService);

authRouter.post("/signup", (req: Request, res: Response, next: NextFunction) => {
    authController.signupUser(req, res, next)
});

authRouter.post("/login", authController.loginUser);

authRouter.get("/confirm-email", authController.confirmEmail);

authRouter.post("/confirm-otp", authController.confirmOTP);

authRouter.post("/reset-password", authController.resetPassword);

authRouter.post("/resend-otp", authController.resendOtp)

export default authRouter;
