import { NextFunction, Request, Response } from 'express';
import UserService from '../services/auth.service';

class AuthController {
    private userService: UserService;

    // Inject UserService into the controller
    constructor(userService: UserService) {
        this.userService = userService;
    }

    async signupUser(req: Request, res: Response, next: NextFunction){
        let dataFromService = await this.userService.createNewUser(req.body);
        return res.status(201).json({success: true, message: "User signup successfull", data: { dataFromService }});
    };

    async loginUser(req: Request, res: Response, next: NextFunction){};

    async confirmEmail(req: Request, res: Response, next: NextFunction){};

    async confirmOTP(req: Request, res: Response, next: NextFunction){};

    async resetPassword(req: Request, res: Response, next: NextFunction){};

    async resendOtp(req: Request, res: Response, next: NextFunction){};

}

export default AuthController;