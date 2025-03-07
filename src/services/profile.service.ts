import { IProfileService } from "../interfaces/IProfileService";
import { IProfileRepository } from "../interfaces/IProfileRepository";
import { Size } from "../interfaces/size.interface";
import resizeImage from "../helpers/sharp.helper";
import uploadToS3 from "../helpers/s3Bucket.helper";
import logger from "../helpers/logger";
import createHttpError from "http-errors";
import sendUserEvents from "../messaging/rabbitmq/user-events.producer";

class ProfileService implements IProfileService {
    private profileRepository: IProfileRepository;

    constructor(profileRepository: IProfileRepository) {
        this.profileRepository = profileRepository;
    }

    /* Get user profile details */
    async getProfileDetails(userID: string): Promise<Object> {
        logger.debug(`Entering getProfileDetails method. Param: ${userID}`, { method: "getProfileDetails", layer: "service" });
        try {
            logger.info(`Fetching profile details for userID: ${userID}`, { layer: "service" });
            const userDetails = await this.profileRepository.getProfileDetails(userID);
            logger.info(`Successfully fetched profile details for userID: ${userID}`, { layer: "service" });
            return userDetails;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getProfileDetails. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getProfileDetails. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to get user profile details");
            }
        } finally {
            logger.debug(`Exiting getProfileDetails method. Param: ${userID}`, { method: "getProfileDetails", layer: "service" });
        }
    }

    /* get profile details with friendship status */
    async getProfileDetailsWithFriendshipStatus(userID: string, profileID: string): Promise<Object> {
        logger.debug(`Entering getProfileDetailsWithFriendshipStatus method. Params: ${userID}, ${profileID}`, { method: "getProfileDetailsWithFriendshipStatus", layer: "service" });
        try {
            logger.info(`Fetching profile details with friendship status for userID: ${userID}`, { layer: "service" });
            const userDetails = await this.profileRepository.getProfileDetailsWithFriendshipStatus(userID, profileID);
            logger.info(`Successfully fetched profile details with friendship status for userID: ${userID}`, { layer: "service" });
            return userDetails;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getProfileDetailsWithFriendshipStatus. Params: ${userID}, ${profileID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getProfileDetailsWithFriendshipStatus. Params: ${userID}, ${profileID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to get user profile details");
            }
        } finally {
            logger.debug(`Exiting getProfileDetailsWithFriendshipStatus method. Params: ${userID}, ${profileID}`, { method: "getProfileDetailsWithFriendshipStatus", layer: "service" });
        }
    }

    /* Update the existing username */
    async updateExistingUsername(username: string, userID: string): Promise<string> {
        logger.debug(`Entering updateExistingUsername method. Params: ${username}, ${userID}`, { method: "updateExistingUsername", layer: "service" });
        try {
            logger.info(`Updating username for userID: ${userID}`, { layer: "service" });
            const updatedUsername = await this.profileRepository.updateExistingUsername(username, userID);
            logger.info(`Successfully updated username for userID: ${userID}`, { layer: "service" });

            sendUserEvents({ type: "username", username: updatedUsername, userID });
            logger.info(`Sent the updated username to other services via rabbitmq for userID: ${userID}`, { layer: "service" });

            return updatedUsername;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updateExistingUsername. Params: ${username}, ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateExistingUsername. Params: ${username}, ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting updateExistingUsername method. Params: ${username}, ${userID}`, { method: "updateExistingUsername", layer: "service" });
        }
    }

    /* Update user description */
    async updateUserDescription(description: string, userID: string): Promise<string> {
        logger.debug(`Entering updateUserDescription method. Params: ${description}, ${userID}`, { method: "updateUserDescription", layer: "service" });
        try {
            logger.info(`Updating description for userID: ${userID}`, { layer: "service" });
            const updatedDescription = await this.profileRepository.updateDescription(description, userID);
            logger.info(`Successfully updated description for userID: ${userID}`, { layer: "service" });
            return updatedDescription;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updateUserDescription. Params: ${description}, ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateUserDescription. Params: ${description}, ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting updateUserDescription method. Params: ${description}, ${userID}`, { method: "updateUserDescription", layer: "service" });
        }
    }

    /* Update user location */
    async updateUserLocation(location: string, userID: string): Promise<string> {
        logger.debug(`Entering updateUserLocation method. Params: ${location}, ${userID}`, { method: "updateUserLocation", layer: "service" });
        try {
            logger.info(`Updating location for userID: ${userID}`, { layer: "service" });
            const updatedLocation = await this.profileRepository.updateLocation(location, userID);
            logger.info(`Successfully updated location for userID: ${userID}`, { layer: "service" });
            return updatedLocation;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updateUserLocation. Params: ${location}, ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateUserLocation. Params: ${location}, ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting updateUserLocation method. Params: ${location}, ${userID}`, { method: "updateUserLocation", layer: "service" });
        }
    }

    /* Add travel history */
    async addTravelHistory(
        location: string,
        year: string,
        places: Array<string>,
        userID: string
    ): Promise<{
        id: number;
        userID: string;
        destination: string;
        yearVisited: string;
        Places: { id: number; travelHistoryID: number; placeName: string }[];
    }> {
        logger.debug(`Entering addTravelHistory method. Params: ${location}, ${year}, ${places}, ${userID}`, { method: "addTravelHistory", layer: "service" });
        try {
            logger.info(`Adding travel history for userID: ${userID}`, { layer: "service" });
            const travelHistory = await this.profileRepository.addTravelHistory(location, year, places, userID);
            logger.info(`Successfully added travel history for userID: ${userID}`, { layer: "service" });
            return travelHistory;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in addTravelHistory. Params: ${location}, ${year}, ${places}, ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in addTravelHistory. Params: ${location}, ${year}, ${places}, ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting addTravelHistory method. Params: ${location}, ${year}, ${places}, ${userID}`, { method: "addTravelHistory", layer: "service" });
        }
    }

    /* Get travel history */
    async getTravelHistory(userID: string): Promise<Object> {
        logger.debug(`Entering getTravelHistory method. Param: ${userID}`, { method: "getTravelHistory", layer: "service" });
        try {
            logger.info(`Fetching travel history for userID: ${userID}`, { layer: "service" });
            const travelHistory = await this.profileRepository.getTravelHistoryWithPlaces(userID);
            logger.info(`Successfully fetched travel history for userID: ${userID}`, { layer: "service" });
            return travelHistory;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getTravelHistory. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getTravelHistory. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to fetch user's travel history");
            }
        } finally {
            logger.debug(`Exiting getTravelHistory method. Param: ${userID}`, { method: "getTravelHistory", layer: "service" });
        }
    }

    /* Add bucket list destination */
    async addBucketListDestination(userID: string, destination: string, notes: string): Promise<Object> {
        logger.debug(`Entering addBucketListDestination method. Params: ${userID}, ${destination}, ${notes}`, { method: "addBucketListDestination", layer: "service" });
        try {
            logger.info(`Adding bucket list destination for userID: ${userID}`, { layer: "service" });
            const bucketListEntry = await this.profileRepository.addBucketList(userID, destination, notes);
            logger.info(`Successfully added bucket list destination for userID: ${userID}`, { layer: "service" });
            return bucketListEntry;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in addBucketListDestination. Params: ${userID}, ${destination}, ${notes}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in addBucketListDestination. Params: ${userID}, ${destination}, ${notes}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to add item to bucket list");
            }
        } finally {
            logger.debug(`Exiting addBucketListDestination method. Params: ${userID}, ${destination}, ${notes}`, { method: "addBucketListDestination", layer: "service" });
        }
    }

    /* Get bucket list destination */
    async getBucketListDestination(userID: string): Promise<Object> {
        logger.debug(`Entering getBucketListDestination method. Param: ${userID}`, { method: "getBucketListDestination", layer: "service" });
        try {
            logger.info(`Fetching bucket list for userID: ${userID}`, { layer: "service" });
            const bucketList = await this.profileRepository.getBucketList(userID);
            logger.info(`Successfully fetched bucket list for userID: ${userID}`, { layer: "service" });
            return bucketList;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getBucketListDestination. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getBucketListDestination. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to fetch user's bucket list");
            }
        } finally {
            logger.debug(`Exiting getBucketListDestination method. Param: ${userID}`, { method: "getBucketListDestination", layer: "service" });
        }
    }

    /* Upload profile or cover picture */
    async uploadPicture(imageBuffer: Buffer, sizes: Size[], type: string, userID: string): Promise<string> {
        logger.debug(`Entering uploadPicture method. Params: ${type}, ${userID}`, { method: "uploadPicture", layer: "service" });
        try {
            logger.info(`Uploading ${type} picture for userID: ${userID}`, { layer: "service" });
            const croppedImagesArray = await resizeImage(imageBuffer, sizes);

            if (type === "profile") {
                const profilePictureBufferString = croppedImagesArray[0]?.buffer;
                const profilePictureImageName = `profile/${userID}-s200.jpg`;
                const profilePictureUrl = await uploadToS3(profilePictureBufferString, profilePictureImageName);
                await this.profileRepository.updatePicture(userID, profilePictureUrl, type);

                sendUserEvents({ type: "picture", profilePicture: profilePictureUrl, userID });
                logger.info(`Sent the updated profile picture url to other services via rabbitmq for userID: ${userID}`, { layer: "service" });

                logger.info(`Successfully uploaded profile picture for userID: ${userID}`, { layer: "service" });
                return profilePictureUrl;
            } else if (type === "cover") {
                const coverPictureImageName = `cover/${userID}-s200x800.jpg`;
                const coverPictureBufferString = croppedImagesArray[0]?.buffer;
                const coverPictureUrl = await uploadToS3(coverPictureBufferString, coverPictureImageName);
                await this.profileRepository.updatePicture(userID, coverPictureUrl, type);

                logger.info(`Successfully uploaded cover picture for userID: ${userID}`, { layer: "service" });
                return coverPictureUrl;
            } else {
                logger.error(`Invalid type provided: ${type}`, { layer: "service" });
                throw createHttpError(400, "Invalid type provided. Must be 'profile' or 'cover'.");
            }
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in uploadPicture. Params: ${type}, ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in uploadPicture. Params: ${type}, ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to update");
            }
        } finally {
            logger.debug(`Exiting uploadPicture method. Params: ${type}, ${userID}`, { method: "uploadPicture", layer: "service" });
        }
    }

    /* report a profile */
    async reportUser(reporterID: string, reportedID: string, issue: string, description?: string, priority?: string): Promise<{ id: number; reporterID: string; reportedID: string; issue: string; description?: string; priority: string; }> {
        logger.debug(`Entering reportUser method. Params: ${reporterID}, ${reportedID}, ${issue}, ${description}, ${priority}`, { method: "reportUser", layer: "service" });
        try {
            logger.info(`Reporting profile for reportedID: ${reportedID} by reporterID: ${reporterID}`, { layer: "service" });
            const report = await this.profileRepository.reportUser(reporterID, reportedID, issue, description, priority);
            logger.info(`Successfully reported profile for reportedID: ${reportedID}`, { layer: "service" });
            return report;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in reportUser. Params: ${reporterID}, ${reportedID}, ${issue}, ${description}, ${priority}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in reportUser. Params: ${reporterID}, ${reportedID}, ${issue}, ${description}, ${priority}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to report profile");
            }
        } finally {
            logger.debug(`Exiting reportUser method. Params: ${reporterID}, ${reportedID}, ${issue}, ${description}, ${priority}`, { method: "reportUser", layer: "service" });
        }
    }
}

export default ProfileService;