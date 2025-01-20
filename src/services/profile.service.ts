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
            if(!username){
                throw createHttpError(400, "Username should not be empty");
            }
            let updatedUsername = await this.profileRepository.updateExistingUsername(username, userID);
            return updatedUsername;
        } catch (error) {
            console.error("Unexpected error:", error);
            throw createHttpError(500, "An unexpected error occurred");
        }
    }
}

export default ProfileService;