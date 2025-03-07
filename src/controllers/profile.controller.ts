import { NextFunction, Request, Response } from 'express';
import { IProfileService } from '../interfaces/IProfileService';
import createHttpError from 'http-errors';
import logger from '../helpers/logger';

class ProfileController {
    private profileService: IProfileService;

    // Inject IProfileService into the controller
    constructor(profileService: IProfileService) {
        this.profileService = profileService;
    }

    /* Get profile details for the user or a friend */
    async getProfileDetails(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getProfileDetails method. Params: ${req.params.id}`, { method: "getProfileDetails", layer: "controller" });
        try {
            const urlID = req.params.id;
            const userID = req.user?.aud!;
            if (urlID === "self") {
                const userDetails = await this.profileService.getProfileDetails(userID);
                logger.info(`Successfully fetched profile details for userID: ${userID}`, { layer: "controller" });
                return res.status(200).json({ success: true, message: "", data: { ...userDetails } });
            } else {
                const userDetails = await this.profileService.getProfileDetailsWithFriendshipStatus(req.user?.aud!, req.params.id);
                logger.info(`Successfully fetched profile details with friendship status for userID: ${userID}`, { layer: "controller" });
                return res.status(200).json({ success: true, message: "", data: { ...userDetails } });
            }
        } catch (error) {
            logger.error(`Error fetching profile details for userID: ${req.params.id}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getProfileDetails method. Params: ${req.params.id}`, { method: "getProfileDetails", layer: "controller" });
        }
    }

    /* Update the username of the authenticated user */
    async updateUsername(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering updateUsername method. Params: ${req.user?.aud!}`, { method: "updateUsername", layer: "controller" });
        try {
            const userID = req.user?.aud!;
            const { username } = req.body;

            if (!username) {
                logger.warn("Username not found in request body", { layer: "controller" });
                throw createHttpError(400, "Username not found");
            }

            logger.info(`Updating username for userID: ${userID}`, { layer: "controller" });
            const response = await this.profileService.updateExistingUsername(username, userID);
            logger.info(`Successfully updated username for userID: ${userID}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Username updated", data: { response } });
        } catch (error) {
            logger.error(`Error updating username for userID: ${req.user?.aud!}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting updateUsername method. Params: ${req.user?.aud!}`, { method: "updateUsername", layer: "controller" });
        }
    }

    /* Update the description of the authenticated user */
    async updateDescription(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering updateDescription method. Params: ${req.user?.aud!}`, { method: "updateDescription", layer: "controller" });
        try {
            const userID = req.user?.aud!;
            const { description } = req.body;

            if (!description) {
                logger.warn("Description not found in request body", { layer: "controller" });
                throw createHttpError(400, "Description cannot be empty");
            }

            logger.info(`Updating description for userID: ${userID}`, { layer: "controller" });
            const response = await this.profileService.updateUserDescription(description, userID);
            logger.info(`Successfully updated description for userID: ${userID}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Description updated", data: { response } });
        } catch (error) {
            logger.error(`Error updating description for userID: ${req.user?.aud!}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting updateDescription method. Params: ${req.user?.aud!}`, { method: "updateDescription", layer: "controller" });
        }
    }

    /* Update the location of the authenticated user */
    async updateLocation(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering updateLocation method. Params: ${req.user?.aud!}`, { method: "updateLocation", layer: "controller" });
        try {
            const userID = req.user?.aud!;
            const { location } = req.body;

            if (!location) {
                logger.warn("Location not found in request body", { layer: "controller" });
                throw createHttpError(400, "Location cannot be empty");
            }

            logger.info(`Updating location for userID: ${userID}`, { layer: "controller" });
            const response = await this.profileService.updateUserLocation(location, userID);
            logger.info(`Successfully updated location for userID: ${userID}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Location updated", data: { response } });
        } catch (error) {
            logger.error(`Error updating location for userID: ${req.user?.aud!}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting updateLocation method. Params: ${req.user?.aud!}`, { method: "updateLocation", layer: "controller" });
        }
    }

    /* Add travel history for the authenticated user */
    async addTravelHistory(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering addTravelHistory method. Params: ${req.user?.aud!}`, { method: "addTravelHistory", layer: "controller" });
        try {
            const userID = req.user?.aud!;
            const { destination, year, places } = req.body;

            if (!destination || !year || !places || places.length === 0) {
                logger.warn("Missing required fields for adding travel history", { layer: "controller" });
                throw createHttpError(400, "All fields are required.");
            }

            logger.info(`Adding travel history for userID: ${userID}`, { layer: "controller" });
            const response = await this.profileService.addTravelHistory(destination, year, places, userID);
            logger.info(`Successfully added travel history for userID: ${userID}`, { layer: "controller" });

            return res.status(201).json({ success: true, message: "Travel history updated", data: { ...response } });
        } catch (error) {
            logger.error(`Error adding travel history for userID: ${req.user?.aud!}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting addTravelHistory method. Params: ${req.user?.aud!}`, { method: "addTravelHistory", layer: "controller" });
        }
    }

    /* Get travel history for the user or a friend */
    async getTravelHistory(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getTravelHistory method. Params: ${req.params.id}`, { method: "getTravelHistory", layer: "controller" });
        try {
            const id = req.params.id;
            const userID = id === "self" ? req.user?.aud! : id;
            logger.info(`Fetching travel history for userID: ${userID}`, { layer: "controller" });

            const travelList = await this.profileService.getTravelHistory(userID);
            logger.info(`Successfully fetched travel history for userID: ${userID}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Travel history fetched", data: { travelList } });
        } catch (error) {
            logger.error(`Error fetching travel history for userID: ${req.params.id}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getTravelHistory method. Params: ${req.params.id}`, { method: "getTravelHistory", layer: "controller" });
        }
    }

    /* Add a destination to the authenticated user's bucket list */
    async addBucketList(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering addBucketList method. Params: ${req.user?.aud!}`, { method: "addBucketList", layer: "controller" });
        try {
            const userID = req.user?.aud!;
            const { destination, notes } = req.body;

            if (!destination || !notes) {
                logger.warn("Missing required fields for adding bucket list", { layer: "controller" });
                throw createHttpError(400, "All fields are required.");
            }

            logger.info(`Adding bucket list for userID: ${userID}`, { layer: "controller" });
            const response = await this.profileService.addBucketListDestination(userID, destination, notes);
            logger.info(`Successfully added bucket list for userID: ${userID}`, { layer: "controller" });

            return res.status(201).json({ success: true, message: "Bucket list updated", data: { ...response } });
        } catch (error) {
            logger.error(`Error adding bucket list for userID: ${req.user?.aud!}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting addBucketList method. Params: ${req.user?.aud!}`, { method: "addBucketList", layer: "controller" });
        }
    }

    /* Get bucket list for the user or a friend */
    async getBucketList(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getBucketList method. Params: ${req.params.id}`, { method: "getBucketList", layer: "controller" });
        try {
            const id = req.params.id;
            const userID = id === "self" ? req.user?.aud! : id;
            logger.info(`Fetching bucket list for userID: ${userID}`, { layer: "controller" });

            const response = await this.profileService.getBucketListDestination(userID);
            logger.info(`Successfully fetched bucket list for userID: ${userID}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Bucket list fetched", data: { response } });
        } catch (error) {
            logger.error(`Error fetching bucket list for userID: ${req.params.id}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getBucketList method. Params: ${req.params.id}`, { method: "getBucketList", layer: "controller" });
        }
    }

    /* Upload profile or cover picture for the authenticated user */
    async uploadPicture(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering uploadPicture method. Params: ${req.user?.aud!}, ${req.params.type}`, { method: "uploadPicture", layer: "controller" });
        try {
            const userID = req?.user?.aud!;
            const file = req?.file;
            const type = req?.params?.type;
            const profilePicSizes = [{ width: 200, height: 200 }];
            const coverPicSizes = [{ width: 800, height: 200 }];

            if (!file) {
                logger.warn("Image not found in request", { layer: "controller" });
                throw createHttpError(400, "Image not found");
            }

            logger.info(`Uploading ${type} picture for userID: ${userID}`, { layer: "controller" });

            if (type === "profile") {
                const profilePictureUrl = await this.profileService.uploadPicture(file?.buffer, profilePicSizes, type, userID);
                logger.info(`Successfully uploaded profile picture for userID: ${userID}`, { layer: "controller" });
                return res.status(201).json({ success: true, message: `${type} picture uploaded`, data: { url: profilePictureUrl } });
            } else if (type === "cover") {
                const coverPictureUrl = await this.profileService.uploadPicture(file?.buffer, coverPicSizes, type, userID);
                logger.info(`Successfully uploaded cover picture for userID: ${userID}`, { layer: "controller" });
                return res.status(201).json({ success: true, message: `${type} picture uploaded`, data: { url: coverPictureUrl } });
            } else {
                logger.error(`Invalid type provided: ${type}`, { layer: "controller" });
                throw createHttpError.BadRequest();
            }
        } catch (error) {
            logger.error(`Error uploading ${req?.params?.type} picture for userID: ${req?.user?.aud!}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting uploadPicture method. Params: ${req.user?.aud!}, ${req.params.type}`, { method: "uploadPicture", layer: "controller" });
        }
    }

    /* Report a user's profile */
    async reportUser(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering reportUser method. Params: ${req.user?.aud}, ${req.params.userID}`, { method: "reportUser", layer: "controller" });
        try {
            const reporterID = req?.user?.aud; // ID of the person who reports the profile
            const reportedID = req?.params.userID;
            if (!reportedID) {
                logger.error("The ID of the profile to be reported is not passed as params", { layer: "controller" });
                throw createHttpError(400, "Unable to report the profile");
            }
            const { issue, priority, description } = req.body;
            if (!issue || !priority) {
                logger.warn("Missing required fields for reporting a profile", { layer: "controller" });
                throw createHttpError(400, "All fields are required");
            }

            logger.info(`Reporting profile for reportedID: ${reportedID} by reporterID: ${reporterID}`, { layer: "controller" });
            await this.profileService.reportUser(reporterID, reportedID, issue, description, priority);
            logger.info(`Successfully reported profile for reportedID: ${reportedID}`, { layer: "controller" });

            return res.status(200).json({ success: true, message: "Profile reported", data: {} });
        } catch (error) {
            logger.error(`Error reporting profile for reportedID: ${req.params.userID}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting reportUser method. Params: ${req.user?.aud}, ${req.params.userID}`, { method: "reportUser", layer: "controller" });
        }
    }
}

export default ProfileController;