import { Router, Request, Response, NextFunction } from "express";
import ProfileRepository from "../repository/profile.repository";
import ProfileService from "../services/profile.service";
import ProfileController from "../controllers/profile.controller";
import { validateAccessToken } from "../helpers/jwt.helper";

const profileRouter = Router();

/* Dependency injection */
const profileRepository = new ProfileRepository();
const profileService = new ProfileService(profileRepository);
const profileController = new ProfileController(profileService);

/* update username router */
profileRouter.put("/username", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.updateUsername(req, res, next)
});

export default profileRouter;