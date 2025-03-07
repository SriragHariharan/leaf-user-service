/*
 * Service file related to handling friend requests
 */

import createHttpError from "http-errors";
import { User } from "../interfaces/auth.interface";
import { IFriendRepository } from "../interfaces/IFriendRepository";
import { IFriendService } from "../interfaces/IFriendService";
import logger from "../helpers/logger";
import sendFriendRequestNotification from "../messaging/rabbitmq/friend-request.produer";

class FriendService implements IFriendService {

    private friendRepository: IFriendRepository;
    constructor(friendRepository: IFriendRepository) {
        this.friendRepository = friendRepository;
    }

    /* Search for users by name and return their profiles with friend status */
    async searchUser(userID: string, query: string): Promise<User[]> {
        logger.debug(`Entering searchUser method. Params: ${userID}, ${query}`, { method: "searchUser", layer: "service" });
        try {
            logger.info(`Call received in searchUser service for user ${userID} with query ${query}`, { layer: "service" });
            let searchResults = await this.friendRepository.searchUsersByName(query, userID);
            logger.info(`Successfully fetched search results for user ${userID}`, { layer: "service" });
            return searchResults;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in searchUser. Params: ${userID}, ${query}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in searchUser. Params: ${userID}, ${query}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting searchUser method. Params: ${userID}, ${query}`, { method: "searchUser", layer: "service" });
        }
    }

    /* Send a friend request from one user to another */
    async sendFriendRequest(userID: string, friendID: string): Promise<boolean> {
        logger.debug(`Entering sendFriendRequest method. Params: ${userID}, ${friendID}`, { method: "sendFriendRequest", layer: "service" });
        try {
            logger.info(`Sending friend request from user ${userID} to friend ${friendID}`, { layer: "service" });
            let existingFriendRequest = await this.friendRepository.checkExistingRequest(userID, friendID);
            if (existingFriendRequest) {
                logger.info(`Friend request already exists from user ${userID} to friend ${friendID}`, { layer: "service" });
                return true;
            } else {
                let newFriendResponse = await this.friendRepository.sendFriendRequest(userID, friendID);
                sendFriendRequestNotification(userID, friendID);
                logger.info(`Successfully sent friend request from user ${userID} to friend ${friendID}`, { layer: "service" });
                return true;
            }
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in sendFriendRequest. Params: ${userID}, ${friendID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in sendFriendRequest. Params: ${userID}, ${friendID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting sendFriendRequest method. Params: ${userID}, ${friendID}`, { method: "sendFriendRequest", layer: "service" });
        }
    }

    /* Get all pending friend requests for a user */
    async getAllFriendRequests(userID: string): Promise<User[] | null> {
        logger.debug(`Entering getAllFriendRequests method. Param: ${userID}`, { method: "getAllFriendRequests", layer: "service" });
        try {
            logger.info(`Fetching all friend requests for user ${userID}`, { layer: "service" });
            let friendRequests = await this.friendRepository.getFriendRequests(userID);
            logger.info(`Successfully fetched friend requests for user ${userID}`, { layer: "service" });
            return friendRequests;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getAllFriendRequests. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getAllFriendRequests. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting getAllFriendRequests method. Param: ${userID}`, { method: "getAllFriendRequests", layer: "service" });
        }
    }

    /* Accept a friend request */
    async acceptFriendRequest(friendRequestID: number, userID: string): Promise<boolean> {
        logger.debug(`Entering acceptFriendRequest method. Params: ${friendRequestID}, ${userID}`, { method: "acceptFriendRequest", layer: "service" });
        try {
            logger.info(`Accepting friend request with ID ${friendRequestID} for user ${userID}`, { layer: "service" });
            await this.friendRepository.acceptFriendRequest(friendRequestID, userID);
            logger.info(`Successfully accepted friend request with ID ${friendRequestID} for user ${userID}`, { layer: "service" });
            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in acceptFriendRequest. Params: ${friendRequestID}, ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in acceptFriendRequest. Params: ${friendRequestID}, ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting acceptFriendRequest method. Params: ${friendRequestID}, ${userID}`, { method: "acceptFriendRequest", layer: "service" });
        }
    }

    /* Reject a friend request */
    async rejectFriendRequest(friendRequestID: number, userID: string): Promise<boolean> {
        logger.debug(`Entering rejectFriendRequest method. Params: ${friendRequestID}, ${userID}`, { method: "rejectFriendRequest", layer: "service" });
        try {
            logger.info(`Rejecting friend request with ID ${friendRequestID} for user ${userID}`, { layer: "service" });
            await this.friendRepository.rejectFriendRequest(friendRequestID, userID);
            logger.info(`Successfully rejected friend request with ID ${friendRequestID} for user ${userID}`, { layer: "service" });
            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in rejectFriendRequest. Params: ${friendRequestID}, ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in rejectFriendRequest. Params: ${friendRequestID}, ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting rejectFriendRequest method. Params: ${friendRequestID}, ${userID}`, { method: "rejectFriendRequest", layer: "service" });
        }
    }

    /* Get the total count of friends for a user */
    async getTotalFriendsCount(userID: string): Promise<number | null> {
        logger.debug(`Entering getTotalFriendsCount method. Param: ${userID}`, { method: "getTotalFriendsCount", layer: "service" });
        try {
            logger.info(`Fetching total friends count for user ${userID}`, { layer: "service" });
            const friendsCount = await this.friendRepository.getTotalFriendsCount(userID);
            logger.info(`Successfully fetched total friends count for user ${userID}`, { layer: "service" });
            return friendsCount;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getTotalFriendsCount. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getTotalFriendsCount. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting getTotalFriendsCount method. Param: ${userID}`, { method: "getTotalFriendsCount", layer: "service" });
        }
    }

    /* Get a paginated list of friends for a user */
    async getFriendsList(userID: string, page: number): Promise<User[] | null> {
        logger.debug(`Entering getFriendsList method. Params: ${userID}, ${page}`, { method: "getFriendsList", layer: "service" });
        try {
            logger.info(`Fetching friends list for user ${userID}, page ${page}`, { layer: "service" });
            const users = await this.friendRepository.getFriendsList(userID, page);
            logger.info(`Successfully fetched friends list for user ${userID}, page ${page}`, { layer: "service" });
            return users;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getFriendsList. Params: ${userID}, ${page}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getFriendsList. Params: ${userID}, ${page}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting getFriendsList method. Params: ${userID}, ${page}`, { method: "getFriendsList", layer: "service" });
        }
    }

    /* Get all friend IDs for a user (used for feed service) */
    async getFriendIDs(userID: string): Promise<string[]> {
        logger.debug(`Entering getFriendIDs method. Param: ${userID}`, { method: "getFriendIDs", layer: "service" });
        try {
            logger.info(`Fetching friend IDs for user ${userID}`, { layer: "service" });
            const friendIDs = await this.friendRepository.getFriendIDs(userID);
            logger.info(`Successfully fetched friend IDs for user ${userID}`, { layer: "service" });
            return friendIDs;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getFriendIDs. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getFriendIDs. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting getFriendIDs method. Param: ${userID}`, { method: "getFriendIDs", layer: "service" });
        }
    }
}

export default FriendService;