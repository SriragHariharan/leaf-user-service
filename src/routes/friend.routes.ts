
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

/* accept friend request */
friendRouter.put("/request/:id", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    friendController.acceptFriendRequest(req, res, next);
});

/* reject friend request */
friendRouter.delete("/request/:id", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    friendController.rejectFriendRequest(req, res, next);
});

/* get the count of friends */
friendRouter.get("/friends/count", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    friendController.getTotalFriendsCount(req, res, next);
});

/* get friends details by page */
friendRouter.get("/friends", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    friendController.getFriendsByPage(req, res, next);
});

/* get friendID's as array for feeds service */
friendRouter.get("/friends/ids", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    friendController.getFriendIDs(req, res, next);
});


export default friendRouter;