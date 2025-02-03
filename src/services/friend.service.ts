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
            logger.info("Call recieved in searchUser service for user ", userID, " with query ", query);
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

    async sendFriendRequest(userID: string, friendID: string): Promise<boolean> {
        try {
            let existingFriendRequest = await this.friendRepository.checkExistingRequest(userID, friendID);
            if(existingFriendRequest) {
                return true;
            }else{
                let newFriendResponse = await this.friendRepository.sendFriendRequest(userID, friendID);
                console.log(newFriendResponse);
                return true;
            }
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* get all friend requests */
    async getAllFriendRequests(userID: string): Promise<User[] | null>{
        try {
            let friendRequests = await this.friendRepository.getFriendRequests(userID);
            return friendRequests;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* accept friend request */
    async acceptFriendRequest(friendRequestID: number, userID: string): Promise<boolean> {
        try {
            await this.friendRepository.acceptFriendRequest(friendRequestID, userID);
            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* accept friend request */
    async rejectFriendRequest(friendRequestID: number, userID: string): Promise<boolean> {
        try {
            await this.friendRepository.rejectFriendRequest(friendRequestID, userID);
            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }
    
    async getTotalFriendsCount(userID: string): Promise<number | null> {
        try {
            const friendsCount = await this.friendRepository.getTotalFriendsCount(userID);
            return friendsCount;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    async getFriendsList(userID: string, page: number): Promise<User[] | null> {
        try {
            const users = await this.friendRepository.getFriendsList(userID, page);
            return users;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* get all friend's ID as array for feed service */
    async getFriendIDs(userID: string): Promise<string[]> {
        try {
            const friendIDs = await this.friendRepository.getFriendIDs(userID);
            return friendIDs;
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