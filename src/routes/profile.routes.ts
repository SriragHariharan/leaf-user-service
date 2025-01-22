import { Router, Request, Response, NextFunction } from "express";
import ProfileRepository from "../repository/profile.repository";
import ProfileService from "../services/profile.service";
import ProfileController from "../controllers/profile.controller";
import { validateAccessToken } from "../helpers/jwt.helper";
import multer from 'multer';

const profileRouter = Router();

/* Dependency injection */
const profileRepository = new ProfileRepository();
const profileService = new ProfileService(profileRepository);
const profileController = new ProfileController(profileService);

/* update username router */
profileRouter.put("/username", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.updateUsername(req, res, next)
});

/* update description router */
profileRouter.put("/description", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.updateDescription(req, res, next)
});

/* update location router */
profileRouter.put("/location", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.updateLocation(req, res, next)
});

/* add travel history router */
profileRouter.post("/travel-history", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.addTravelHistory(req, res, next)
});

/* get travel history router */
profileRouter.get("/travel-history", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.getTravelHistory(req, res, next)
});

/* add bucket list router */
profileRouter.post("/bucket-list", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.addBucketList(req, res, next)
});

/* get bucket list router */
profileRouter.get("/bucket-list", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.getBucketList(req, res, next)
});


export default profileRouter;