import createHttpError from "http-errors";
import { IProfileRepository } from "../interfaces/IProfileRepository";
import { Size } from "../interfaces/size.interface";
import resizeImage from "../helpers/sharp.helper";
import uploadToS3 from "../helpers/s3Bucket.helper";
import { Auth } from "../interfaces/auth.interface";

class ProfileService{

    private profileRepository: IProfileRepository
    constructor(profileRepository: IProfileRepository){
        this.profileRepository = profileRepository;
    }

    /* get user profile controller */
    async getProfileDetails(userID: string): Promise<Object>{
        try {
            let userDetails = await this.profileRepository.getProfileDetails(userID);
            return userDetails;
        } catch (error) {
            throw createHttpError(500, "Unable to get user profile details");
        }
    }

    /* update the existing username service */
    async updateExistingUsername(username: string, userID: string): Promise<string> {   
        try {
            let updatedUsername = await this.profileRepository.updateExistingUsername(username, userID);
            return updatedUsername;
        } catch (error) {
            console.error("Unexpected error:", error);
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* Update user description */
    async updateUserDescription(description: string, userID: string): Promise<string> {   
        try {
            let updatedDescription = await this.profileRepository.updateDescription(description, userID);
            return updatedDescription;
        } catch (error) {
            console.error("Unexpected error:", error);
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* Update user description */
    async updateUserLocation(location: string, userID: string): Promise<string> {   
        try {
            let updatedLocation = await this.profileRepository.updateLocation(location, userID);
            return updatedLocation;
        } catch (error) {
            console.error("Unexpected error:", error);
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* add travel history */
    async addTravelHistory(location: string, year: string, places:Array<string>, userID: string): Promise<{location: string, year: number|string, places:Array<string>}> {   
        try {
            return await this.profileRepository.addTravelHistory(location, year, places, userID);
        } catch (error) {
            console.error("Unexpected error:", error);
            throw createHttpError(500, "An unexpected error occurred");
        }
    }

    /* get travel history */
    async getTravelHistory(userID: string): Promise<Object> {
        try {
            return await this.profileRepository.getTravelHistoryWithPlaces(userID);
        } catch (error) {
            console.error("Unexpected error:", error);
            throw createHttpError(500, "Unable to fetch user's travel history");
        }
    }

    async addBucketListDestination(userID: string, destination: string, notes: string): Promise<Object>{
        try {
            return await this.profileRepository.addBucketList(userID, destination, notes)
        } catch (error) {
            throw createHttpError(500, "Unable to add item to bucket list");
        }
    }

    async getBucketListDestination(userID: string): Promise<Object>{
        try {
            return await this.profileRepository.getBucketList(userID)
        } catch (error) {
            throw createHttpError(500, "Unable to fetch user's bucket list");
        }
    }

    /*
     *   Below is the service for uploading the profile picture and cover picture to the aws s3 after resize and compression
    */
    async uploadPicture(imageBuffer: Buffer, sizes: Size[], type: string, userID: string): Promise<string> {
        try {
            let croppedImagesArray = await resizeImage(imageBuffer, sizes);
            
            if (type === "profile") {
                /* collect the buffers */
                const profilePictureBufferString = croppedImagesArray[0]?.buffer;

                /* generate image names */
                const profilePictureImageName = `profile/${userID}-s200.jpg`;

                /* upload to s3 buckets */
                const profilePictureUrl = await uploadToS3(profilePictureBufferString, profilePictureImageName);

                /* update to db */
                await this.profileRepository.updatePicture(userID, profilePictureUrl, type);

                return profilePictureUrl;
            } else if (type === "cover") {
                /* generate image name */
                const coverPictureImageName = `cover/${userID}-s200x800.jpg`;
                /* collect the buffer */
                const coverPictureBufferString = croppedImagesArray[0]?.buffer;
                /* upload to s3 */
                const coverPictureUrl = await uploadToS3(coverPictureBufferString, coverPictureImageName);
                /* update the link to the database */
                await this.profileRepository.updatePicture(userID, coverPictureUrl, type);

                return coverPictureUrl;
            } else {
                throw createHttpError(400, "Invalid type provided. Must be 'profile' or 'cover'.");
            }
        } catch (error) {
            throw createHttpError(500, "Unable to update");
        }
    }
}

export default ProfileService;