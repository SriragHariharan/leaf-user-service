import { Router, Request, Response, NextFunction } from "express";
import ProfileRepository from "../repository/profile.repository";
import ProfileService from "../services/profile.service";
import ProfileController from "../controllers/profile.controller";
import { validateAccessToken } from "../helpers/jwt.helper";
import upload from "../helpers/multer.helper";

const profileRouter = Router();

/* Dependency injection */
const profileRepository = new ProfileRepository();
const profileService = new ProfileService(profileRepository);
const profileController = new ProfileController(profileService);

/* get profile details */
profileRouter.get("/:id", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.getProfileDetails(req, res, next)
});

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
profileRouter.get("/travel-history/:id", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.getTravelHistory(req, res, next)
});

/* add bucket list router */
profileRouter.post("/bucket-list", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.addBucketList(req, res, next)
});

/* get bucket list router */
profileRouter.get("/bucket-list/:id", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    profileController.getBucketList(req, res, next)
});

profileRouter.post("/picture/:type", validateAccessToken, upload.single("picture"), (req: Request, res: Response, next: NextFunction) => {
    profileController.uploadPicture(req, res, next)
});

export default profileRouter;