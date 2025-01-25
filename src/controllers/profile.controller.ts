import { NextFunction, Request, Response } from 'express';
import ProfileService from '../services/profile.service';
import createHttpError from 'http-errors';
import logger from '../helpers/logger'; // Assuming you have a logger instance

class ProfileController {
    private profileService: ProfileService;

    constructor(profileService: ProfileService) {
        this.profileService = profileService;
    }

    /* Get profile details controller */
    async getProfileDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const userID = id === "self" ? req.user?.aud! : id;
            logger.info(`Fetching profile details for userID: ${userID}`);

            const userDetails = await this.profileService.getProfileDetails(userID);
            logger.info(`Successfully fetched profile details for userID: ${userID}`);

            return res.status(200).json({ success: true, message: "", data: { ...userDetails } });
        } catch (error) {
            logger.error(`Error fetching profile details for userID: ${req.params.id}`, { error });
            next(error);
        }
    }

    /* Update existing username controller */
    async updateUsername(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req.user?.aud!;
            const { username } = req.body;

            if (!username) {
                logger.warn("Username not found in request body");
                throw createHttpError(400, "Username not found");
            }

            logger.info(`Updating username for userID: ${userID}`);
            const response = await this.profileService.updateExistingUsername(username, userID);
            logger.info(`Successfully updated username for userID: ${userID}`);

            return res.status(200).json({ success: true, message: "Username updated", data: { response } });
        } catch (error) {
            logger.error(`Error updating username for userID: ${req.user?.aud!}`, { error });
            next(error);
        }
    }

    /* Update description controller */
    async updateDescription(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req.user?.aud!;
            const { description } = req.body;

            if (!description) {
                logger.warn("Description not found in request body");
                throw createHttpError(400, "Description cannot be empty");
            }

            logger.info(`Updating description for userID: ${userID}`);
            const response = await this.profileService.updateUserDescription(description, userID);
            logger.info(`Successfully updated description for userID: ${userID}`);

            return res.status(200).json({ success: true, message: "Description updated", data: { response } });
        } catch (error) {
            logger.error(`Error updating description for userID: ${req.user?.aud!}`, { error });
            next(error);
        }
    }

    /* Update location controller */
    async updateLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req.user?.aud!;
            const { location } = req.body;

            if (!location) {
                logger.warn("Location not found in request body");
                throw createHttpError(400, "Location cannot be empty");
            }

            logger.info(`Updating location for userID: ${userID}`);
            const response = await this.profileService.updateUserLocation(location, userID);
            logger.info(`Successfully updated location for userID: ${userID}`);

            return res.status(200).json({ success: true, message: "Location updated", data: { response } });
        } catch (error) {
            logger.error(`Error updating location for userID: ${req.user?.aud!}`, { error });
            next(error);
        }
    }

    /* Add travel history */
    async addTravelHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req.user?.aud!;
            const { destination, year, places } = req.body;

            if (!destination || !year || !places || places.length === 0) {
                logger.warn("Missing required fields for adding travel history");
                throw createHttpError(400, "All fields are required.");
            }

            logger.info(`Adding travel history for userID: ${userID}`);
            const response = await this.profileService.addTravelHistory(destination, year, places, userID);
            logger.info(`Successfully added travel history for userID: ${userID}`);

            return res.status(201).json({ success: true, message: "Travel history updated", data: { ...response } });
        } catch (error) {
            logger.error(`Error adding travel history for userID: ${req.user?.aud!}`, { error });
            next(error);
        }
    }

    /* Get travel history */
    async getTravelHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const userID = id === "self" ? req.user?.aud! : id;
            logger.info(`Fetching travel history for userID: ${userID}`);

            const travelList = await this.profileService.getTravelHistory(userID);
            logger.info(`Successfully fetched travel history for userID: ${userID}`);

            return res.status(200).json({ success: true, message: "Travel history fetched", data: { travelList } });
        } catch (error) {
            logger.error(`Error fetching travel history for userID: ${req.params.id}`, { error });
            next(error);
        }
    }

    /* Add bucket list */
    async addBucketList(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req.user?.aud!;
            const { destination, notes } = req.body;

            if (!destination || !notes) {
                logger.warn("Missing required fields for adding bucket list");
                throw createHttpError(400, "All fields are required.");
            }

            logger.info(`Adding bucket list for userID: ${userID}`);
            const response = await this.profileService.addBucketListDestination(userID, destination, notes);
            logger.info(`Successfully added bucket list for userID: ${userID}`);

            return res.status(201).json({ success: true, message: "Bucket list updated", data: { ...response } });
        } catch (error) {
            logger.error(`Error adding bucket list for userID: ${req.user?.aud!}`, { error });
            next(error);
        }
    }

    /* Get bucket list */
    async getBucketList(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const userID = id === "self" ? req.user?.aud! : id;
            logger.info(`Fetching bucket list for userID: ${userID}`);

            const response = await this.profileService.getBucketListDestination(userID);
            logger.info(`Successfully fetched bucket list for userID: ${userID}`);

            return res.status(200).json({ success: true, message: "Bucket list fetched", data: { response } });
        } catch (error) {
            logger.error(`Error fetching bucket list for userID: ${req.params.id}`, { error });
            next(error);
        }
    }

    /* Upload profile or cover picture */
    async uploadPicture(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req?.user?.aud!;
            const file = req?.file;
            const type = req?.params?.type;
            const profilePicSizes = [{ width: 200, height: 200 }];
            const coverPicSizes = [{ width: 800, height: 200 }];

            if (!file) {
                logger.warn("Image not found in request");
                throw createHttpError(400, "Image not found");
            }

            logger.info(`Uploading ${type} picture for userID: ${userID}`);

            if (type === "profile") {
                const profilePictureUrl = await this.profileService.uploadPicture(file?.buffer, profilePicSizes, type, userID);
                logger.info(`Successfully uploaded profile picture for userID: ${userID}`);
                return res.status(201).json({ success: true, message: `${type} picture uploaded`, data: { url: profilePictureUrl } });
            } else if (type === "cover") {
                const coverPictureUrl = await this.profileService.uploadPicture(file?.buffer, coverPicSizes, type, userID);
                logger.info(`Successfully uploaded cover picture for userID: ${userID}`);
                return res.status(201).json({ success: true, message: `${type} picture uploaded`, data: { url: coverPictureUrl } });
            } else {
                logger.error(`Invalid type provided: ${type}`);
                throw createHttpError.BadRequest();
            }
        } catch (error) {
            logger.error(`Error uploading ${req?.params?.type} picture for userID: ${req?.user?.aud!}`, { error });
            next(error);
        }
    }
}

export default ProfileController;