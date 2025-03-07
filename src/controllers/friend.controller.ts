/*
 * Controller to handle friend requests
 */

import { NextFunction, Request, Response } from 'express';
import logger from '../helpers/logger';
import { IFriendService } from '../interfaces/IFriendService';
import createHttpError from 'http-errors';

class FriendController {

    private friendService: IFriendService;
    constructor(friendService: IFriendService) {
        this.friendService = friendService;
    }

    /* Search for users by name */
    async searchUsers(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering searchUsers method. Params: ${req.user?.aud}, ${req.query?.search}`, { method: "searchUsers", layer: "controller" });
        try {
            logger.info("Call received in searchUsers controller for userID: ", req.user?.aud, { layer: "controller" });
            const query = req.query?.search as string | undefined;
            if (!query) {
                logger.warn("Search query is empty for userID: ", req.user?.aud, { layer: "controller" });
                throw createHttpError(400, "Search query cannot be empty");
            }
            const searchedUsers = await this.friendService.searchUser(req.user?.aud, query);
            logger.info("Search results returned for user: ", req.user?.aud, { layer: "controller" });
            return res.status(200).json({ success: true, message: "", data: { search: searchedUsers } });
        } catch (error) {
            logger.error("Error in searchUsers controller: ", { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting searchUsers method. Params: ${req.user?.aud}, ${req.query?.search}`, { method: "searchUsers", layer: "controller" });
        }
    }

    /* Send a friend request from one user to another */
    async sendFriendRequest(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering sendFriendRequest method. Params: ${req.user?.aud}, ${req.params?.friendID}`, { method: "sendFriendRequest", layer: "controller" });
        try {
            logger.info("Call received in sendFriendRequest Controller for userID: ", req.user?.aud, "to friend", req.params?.friendID, { layer: "controller" });
            const userID = req.user?.aud;
            const friendID = req.params?.friendID;
            if (!friendID) {
                logger.error("Friend id not provided for user: ", userID, { layer: "controller" });
                throw createHttpError(400, "Invalid friend request");
            }
            await this.friendService.sendFriendRequest(userID, friendID);
            logger.info("Friend request sent to user: ", friendID, "by userID: ", req.user?.aud, { layer: "controller" });
            return res.status(200).json({ success: true, message: "Friend request sent", data: { friendID } });
        } catch (error) {
            logger.error("Error in sendFriendRequest controller: ", { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting sendFriendRequest method. Params: ${req.user?.aud}, ${req.params?.friendID}`, { method: "sendFriendRequest", layer: "controller" });
        }
    }

    /* Get all pending friend requests for a user */
    async getFriendRequests(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getFriendRequests method. Param: ${req.user?.aud}`, { method: "getFriendRequests", layer: "controller" });
        try {
            const userID = req.user?.aud;
            logger.info("Call received in getFriendRequest controller for userID: ", userID, { layer: "controller" });
            let friendRequests = await this.friendService.getAllFriendRequests(userID);
            logger.info("Sent the Friend requests received for userID: ", userID, { layer: "controller" });
            return res.status(200).json({ success: true, message: "", data: { friendRequests } });
        } catch (error) {
            logger.error("Error in getFriendRequests controller: ", { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getFriendRequests method. Param: ${req.user?.aud}`, { method: "getFriendRequests", layer: "controller" });
        }
    }

    /* Accept a friend request */
    async acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering acceptFriendRequest method. Params: ${req.params.id}, ${req.user?.aud}`, { method: "acceptFriendRequest", layer: "controller" });
        try {
            const friendRequestID = Number(req.params.id);
            const userID = req.user?.aud;
            if (!friendRequestID) {
                logger.error("Friend request ID is missing in params for friend request ID: ", friendRequestID, " of user ID ", userID, { layer: "controller" });
                throw createHttpError(400, "Invalid friend request");
            }
            await this.friendService.acceptFriendRequest(friendRequestID, userID);
            logger.info("Friend request accepted for friend request ID: ", friendRequestID, " of user ID ", userID, { layer: "controller" });
            return res.status(201).json({ success: true, message: "Friend request accepted", data: {} });
        } catch (error) {
            logger.error("Error in acceptFriendRequest controller: ", { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting acceptFriendRequest method. Params: ${req.params.id}, ${req.user?.aud}`, { method: "acceptFriendRequest", layer: "controller" });
        }
    }

    /* Reject a friend request */
    async rejectFriendRequest(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering rejectFriendRequest method. Params: ${req.params.id}, ${req.user?.aud}`, { method: "rejectFriendRequest", layer: "controller" });
        try {
            const friendRequestID = Number(req.params.id);
            const userID = req.user?.aud;
            if (!friendRequestID) {
                logger.error("Friend request ID is missing in params for friend request ID: ", friendRequestID, " of user ID ", userID, { layer: "controller" });
                throw createHttpError(400, "Invalid friend request");
            }
            await this.friendService.rejectFriendRequest(friendRequestID, userID);
            logger.info("Friend request rejected for friend request ID: ", friendRequestID, " of user ID ", userID, { layer: "controller" });
            return res.status(201).json({ success: true, message: "Friend request rejected", data: {} });
        } catch (error) {
            logger.error("Error in rejectFriendRequest controller: ", { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting rejectFriendRequest method. Params: ${req.params.id}, ${req.user?.aud}`, { method: "rejectFriendRequest", layer: "controller" });
        }
    }

    /* Get the total count of friends for a user */
    async getTotalFriendsCount(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getTotalFriendsCount method. Param: ${req.user?.aud}`, { method: "getTotalFriendsCount", layer: "controller" });
        try {
            const userID = req.user?.aud;
            logger.info("Fetching total friends count for userID: ", userID, { layer: "controller" });
            const friendsCount = await this.friendService.getTotalFriendsCount(userID);
            logger.info("Successfully fetched total friends count for userID: ", userID, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { count: friendsCount } });
        } catch (error) {
            logger.error("Error in getTotalFriendsCount controller: ", { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getTotalFriendsCount method. Param: ${req.user?.aud}`, { method: "getTotalFriendsCount", layer: "controller" });
        }
    }

    /* Get a paginated list of friends for a user */
    async getFriendsByPage(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getFriendsByPage method. Params: ${req.user?.aud}, ${req.query?.page}`, { method: "getFriendsByPage", layer: "controller" });
        try {
            const page = Number(req.query?.page) ?? 1;
            const userID = req.user?.aud;
            logger.info("Fetching friends list for userID: ", userID, "page: ", page, { layer: "controller" });
            const friends = await this.friendService.getFriendsList(userID, page);
            logger.info("Successfully fetched friends list for userID: ", userID, "page: ", page, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { friends } });
        } catch (error) {
            logger.error("Error in getFriendsByPage controller: ", { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getFriendsByPage method. Params: ${req.user?.aud}, ${req.query?.page}`, { method: "getFriendsByPage", layer: "controller" });
        }
    }

    /* Get all friend IDs for a user (used for feed service) */
    async getFriendIDs(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getFriendIDs method. Param: ${req.user?.aud}`, { method: "getFriendIDs", layer: "controller" });
        try {
            const userID = req.user?.aud;
            if (!userID) {
                logger.error("User ID is missing with the endpoint", { layer: "controller" });
                throw createHttpError(400, "User ID is missing");
            }
            logger.info("Fetching friend IDs for userID: ", userID, { layer: "controller" });
            const friendIDs = await this.friendService.getFriendIDs(userID);
            logger.info("Successfully fetched friend IDs for userID: ", userID, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { friendIDs } });
        } catch (error) {
            logger.error("Error in getFriendIDs controller: ", { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getFriendIDs method. Param: ${req.user?.aud}`, { method: "getFriendIDs", layer: "controller" });
        }
    }
}

export default FriendController;