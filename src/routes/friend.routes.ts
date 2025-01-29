
//create an object of db and insert to service

import { Router, Request, Response, NextFunction } from "express";
import FriendController from "../controllers/friend.controller";
import FriendRepository from "../repository/friend.repostory";
import FriendService from "../services/friend.service";
import { validateAccessToken } from "../helpers/jwt.helper";

const friendRepository = new FriendRepository();

const friendService = new FriendService(friendRepository)

const friendController = new FriendController(friendService);

const friendRouter = Router();

friendRouter.get('/search', validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    friendController.searchUsers(req, res, next);
});

/* send friend request */
friendRouter.post('/request/:friendID', validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    friendController.sendFriendRequest(req, res, next);
});

/* get all friend requests */
friendRouter.get('/request', validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    friendController.getFriendRequests(req, res, next);
});


export default friendRouter;