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
            logger.info("Call recieved in searchUsers controller for userID: " + req.user?.aud);
            const query = req.query?.search as string | undefined;
            if(!query){
                throw createHttpError(400, "Search query cannot be empty");
            }
            const searchedUsers = await this.friendService.searchUser(req.user?.aud, query);
            logger.info("Search results returned for user: " + req.user?.aud);
            return res.status(200).json({ success: true, message:"", data: { search: searchedUsers }});
        } catch (error) {
            logger.error("Error in searchUsers controller: ", error);
            next(error);
        }
    }
}

export default FriendController;