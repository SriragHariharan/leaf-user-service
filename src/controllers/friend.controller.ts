/*
 * Controller to handle friend requests
 */

import { NextFunction, Request, Response } from 'express';
import logger from '../helpers/logger';
import { IFriendService } from '../interfaces/IFriendService';
import createHttpError from 'http-errors';

class FriendController{
    
    private friendService: IFriendService;
    constructor(friendService: IFriendService){
        this.friendService = friendService;
    }

    async searchUsers(req: Request, res: Response, next: NextFunction){
        try {
            logger.info("Call recieved in searchUsers controller for userID: ", req.user?.aud);
            const query = req.query?.search as string | undefined;
            if(!query){
                throw createHttpError(400, "Search query cannot be empty");
            }
            const searchedUsers = await this.friendService.searchUser(req.user?.aud, query);
            logger.info("Search results returned for user: ", req.user?.aud);
            return res.status(200).json({ success: true, message:"", data: { search: searchedUsers }});
        } catch (error) {
            logger.error("Error in searchUsers controller: ", error);
            next(error);
        }
    }

    async sendFriendRequest(req: Request, res: Response, next: NextFunction){
        try {
            logger.info("Call received in sendFriendRequest Controller for userID: ", req.user?.aud, "to friend", req.params?.friendID);
            const userID = req.user?.aud;
            const friendID = req.params?.friendID;
            if(!friendID){
                logger.error("Friend id not provided for user: ", userID);
                throw createHttpError(400, "Invalid friend request");
            }
            await this.friendService.sendFriendRequest(userID, friendID);
            logger.info("Friend request sent to user: ", friendID, "by userID: ", req.user?.aud);
            return res.status(200).json({ success: true, message: "Friend request sent", data: { friendID } });
        } catch (error) {
            logger.error("Error in sendFriendRequest controller: ", error);
            next(error);
        }
    }

    async getFriendRequests(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req.user?.aud;
            logger.info("Call received in getFriendRequest controller for userID: ", userID);
            let friendRequests = await this.friendService.getAllFriendRequests(userID);
            logger.info("Sent the Friend requests received for userID : ", userID);
            return res.status(200).json({ success: true, message: "", data: { friendRequests } });
        } catch (error) {
            logger.error("Error in getFriendRequests controller: ", error);
            next(error);
        }
    }

    async acceptFriendRequest(req: Request, res: Response, next: NextFunction){
        try {
            const friendRequestID = Number(req.params.id);
            const userID = req.user?.aud;
            if(!friendRequestID){
                logger.error("friend request ID is missing in params for friend request ID: ", friendRequestID, " of user ID ", userID);
                throw createHttpError(400, "Invalid friend request");
            }
            await this.friendService.acceptFriendRequest(friendRequestID, userID);
            logger.info("Friend request accepted for friend request ID: ", friendRequestID, " of user ID ", userID);
            return res.status(201).json({ success: true, message: "Friend request accepted", data: {}})
        } catch (error) {
            next(error);   
        }
    }

    async rejectFriendRequest(req: Request, res: Response, next: NextFunction){
        try {
            const friendRequestID = Number(req.params.id);
            const userID = req.user?.aud;
            if(!friendRequestID){
                logger.error("friend request ID is missing in params for friend request ID: ", friendRequestID, " of user ID ", userID);
                throw createHttpError(400, "Invalid friend request");
            }
            await this.friendService.rejectFriendRequest(friendRequestID, userID);
            logger.info("Friend request accepted for friend request ID: ", friendRequestID, " of user ID ", userID);
            return res.status(201).json({ success: true, message: "Friend request rejected", data: {}})
        } catch (error) {
            next(error);
        }
    }

    async getTotalFriendsCount(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req.user?.aud;
            const friendsCount = await this.friendService.getTotalFriendsCount(userID);
            return res.status(200).json({ success: true, message: null, data: { count: friendsCount }});
        } catch (error) {
            next(error);
        }
    }

    async getFriendsByPage(req: Request, res: Response, next: NextFunction){
        try {
            const page = Number(req.query?.page) ?? 1;
            const userID = req.user?.aud;
            const friends = await this.friendService.getFriendsList(userID, page)
            return res.status(200).json({ success: true, message:null, data: { friends }});
        } catch (error) {
            next(error);
        }
    }

    /* get friendID's as array */
    async getFriendIDs(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req.user?.aud;
            if(!userID){
                logger.error("User ID is missing with the endpoint");
                throw createHttpError(400, "User ID is missing");
            }
            const friendIDs = await this.friendService.getFriendIDs(userID);
            return res.status(200).json({ success: true, message: null, data: { friendIDs }});
        } catch (error) {
            next(error);
        }
    }

}

export default FriendController;