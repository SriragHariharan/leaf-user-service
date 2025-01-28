/*
*  Service file related to handling friend requests
*/

import createHttpError from "http-errors";
import { User } from "../interfaces/auth.interface";
import { IFriendRepository } from "../interfaces/IFriendRepository";
import { IFriendService } from "../interfaces/IFriendService";
import logger from "../helpers/logger";

class FriendService implements IFriendService {

    private friendRepository: IFriendRepository
    constructor(friendRepository: IFriendRepository){
        this.friendRepository = friendRepository;
    }

    async searchUser(userID: string, query: string): Promise<User[]> {
        try {
            logger.info("Call recieved in searchUser service for user " + userID + " with query " + query);
            let searchResults = await this.friendRepository.searchUsersByName(query, userID);
            return searchResults;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }
}

export default FriendService;