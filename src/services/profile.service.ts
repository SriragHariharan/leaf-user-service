import createHttpError from "http-errors";
import { IProfileRepository } from "../interfaces/IProfileRepository";

class ProfileService{

    private profileRepository: IProfileRepository
    constructor(profileRepository: IProfileRepository){
        this.profileRepository = profileRepository;
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
}

export default ProfileService;