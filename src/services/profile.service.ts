import { IProfileService } from "../interfaces/IProfileService";
import { IProfileRepository } from "../interfaces/IProfileRepository";
import { Size } from "../interfaces/size.interface";
import resizeImage from "../helpers/sharp.helper";
import uploadToS3 from "../helpers/s3Bucket.helper";
import logger from "../helpers/logger";
import createHttpError from "http-errors";
import sendUserEvents from "../messaging/rabbitmq/producer";

class ProfileService implements IProfileService {
    private profileRepository: IProfileRepository;

    constructor(profileRepository: IProfileRepository) {
        this.profileRepository = profileRepository;
    }

    /* Get user profile details */
    async getProfileDetails(userID: string): Promise<Object> {
        try {
            logger.info(`Fetching profile details for userID: ${userID}`);
            const userDetails = await this.profileRepository.getProfileDetails(userID);
            logger.info(`Successfully fetched profile details for userID: ${userID}`);
            return userDetails;
        } catch (error) {
            logger.error(`Error fetching profile details for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to get user profile details");
        }
    }

    /* Update the existing username */
    async updateExistingUsername(username: string, userID: string): Promise<string> {
        try {
            logger.info(`Updating username for userID: ${userID}`);
            const updatedUsername = await this.profileRepository.updateExistingUsername(username, userID);
            logger.info(`Successfully updated username for userID: ${userID}`);

            sendUserEvents({ type: "username", username: updatedUsername, userID });
            logger.info(`Sent the updated username to other services via rabbitmq for userID: ${userID}`);

            return updatedUsername;
        } catch (error) {
            logger.error(`Error updating username for userID: ${userID}`, { error });
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* Update user description */
    async updateUserDescription(description: string, userID: string): Promise<string> {
        try {
            logger.info(`Updating description for userID: ${userID}`);
            const updatedDescription = await this.profileRepository.updateDescription(description, userID);
            logger.info(`Successfully updated description for userID: ${userID}`);
            return updatedDescription;
        } catch (error) {
            logger.error(`Error updating description for userID: ${userID}`, { error });
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* Update user location */
    async updateUserLocation(location: string, userID: string): Promise<string> {
        try {
            logger.info(`Updating location for userID: ${userID}`);
            const updatedLocation = await this.profileRepository.updateLocation(location, userID);
            logger.info(`Successfully updated location for userID: ${userID}`);
            return updatedLocation;
        } catch (error) {
            logger.error(`Error updating location for userID: ${userID}`, { error });
            throw createHttpError(500, "An unexpected error occurred");
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
        try {
            logger.info(`Adding travel history for userID: ${userID}`);
            const travelHistory = await this.profileRepository.addTravelHistory(location, year, places, userID);
            logger.info(`Successfully added travel history for userID: ${userID}`);
            return travelHistory;
        } catch (error) {
            logger.error(`Error adding travel history for userID: ${userID}`, { error });
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* Get travel history */
    async getTravelHistory(userID: string): Promise<Object> {
        try {
            logger.info(`Fetching travel history for userID: ${userID}`);
            const travelHistory = await this.profileRepository.getTravelHistoryWithPlaces(userID);
            logger.info(`Successfully fetched travel history for userID: ${userID}`);
            return travelHistory;
        } catch (error) {
            logger.error(`Error fetching travel history for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to fetch user's travel history");
        }
    }

    /* Add bucket list destination */
    async addBucketListDestination(userID: string, destination: string, notes: string): Promise<Object> {
        try {
            logger.info(`Adding bucket list destination for userID: ${userID}`);
            const bucketListEntry = await this.profileRepository.addBucketList(userID, destination, notes);
            logger.info(`Successfully added bucket list destination for userID: ${userID}`);
            return bucketListEntry;
        } catch (error) {
            logger.error(`Error adding bucket list destination for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to add item to bucket list");
        }
    }

    /* Get bucket list destination */
    async getBucketListDestination(userID: string): Promise<Object> {
        try {
            logger.info(`Fetching bucket list for userID: ${userID}`);
            const bucketList = await this.profileRepository.getBucketList(userID);
            logger.info(`Successfully fetched bucket list for userID: ${userID}`);
            return bucketList;
        } catch (error) {
            logger.error(`Error fetching bucket list for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to fetch user's bucket list");
        }
    }

    /* Upload profile or cover picture */
    async uploadPicture(imageBuffer: Buffer, sizes: Size[], type: string, userID: string): Promise<string> {
        try {
            logger.info(`Uploading ${type} picture for userID: ${userID}`);
            const croppedImagesArray = await resizeImage(imageBuffer, sizes);

            if (type === "profile") {
                const profilePictureBufferString = croppedImagesArray[0]?.buffer;
                const profilePictureImageName = `profile/${userID}-s200.jpg`;
                const profilePictureUrl = await uploadToS3(profilePictureBufferString, profilePictureImageName);
                await this.profileRepository.updatePicture(userID, profilePictureUrl, type);

                sendUserEvents({type: "picture", profilePicture: profilePictureUrl, userID});
                logger.info(`Sent the updated profile picture url to other services via rabbitmq for userID: ${userID}`);

                logger.info(`Successfully uploaded profile picture for userID: ${userID}`);
                return profilePictureUrl;
            } else if (type === "cover") {
                const coverPictureImageName = `cover/${userID}-s200x800.jpg`;
                const coverPictureBufferString = croppedImagesArray[0]?.buffer;
                const coverPictureUrl = await uploadToS3(coverPictureBufferString, coverPictureImageName);
                await this.profileRepository.updatePicture(userID, coverPictureUrl, type);

                logger.info(`Successfully uploaded cover picture for userID: ${userID}`);
                return coverPictureUrl;
            } else {
                logger.error(`Invalid type provided: ${type}`);
                throw createHttpError(400, "Invalid type provided. Must be 'profile' or 'cover'.");
            }
        } catch (error) {
            logger.error(`Error uploading ${type} picture for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to update");
        }
    }
}

export default ProfileService;