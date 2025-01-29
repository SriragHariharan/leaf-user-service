import createHttpError from "http-errors";
import logger from "../helpers/logger";
import prisma from "../helpers/prisma.helper";
import { IFriendRepository } from "../interfaces/IFriendRepository";
import { User } from "../interfaces/auth.interface";

class FriendRepository implements IFriendRepository{


    async searchUsersByName(search: string, userID: string): Promise<User[]> {
        try {
            logger.info("Searching for users based on query string: ", search);
            const users = await prisma.profile.findMany({
                where: {
                    username: {
                        contains: search,
                    },
                    userID: {
                        not: userID,
                    },
                },
                take: 100, // Limit to 100 users
                select: {
                    userID: true,
                    username: true,
                    description: true,
                    profilePicture: true,
                },
            });
            logger.info("User fetched from db for user: ", userID);
            return users;

        } catch (error) {
            logger.error(error);
            throw new Error("something went wrong searching users");
        }
    }

    async checkExistingRequest(userID: string, friendID: string)
        : Promise<{ 
            id: number; 
            userID: string; 
            createdAt: Date; 
            friendID: string; 
            status: string 
        } | null> 
        {
        try {
            const existingRequest = await prisma.friends.findFirst({
                where: {
                    userID: userID,
                    friendID: friendID
                },
            });
            return existingRequest;
        } catch (error) {
            logger.error(error);
            throw createHttpError(500, "Something went wrong");
        }
    }

    async sendFriendRequest(userID: string, friendID: string): Promise<boolean>{
        try {
            logger.info("Sending friend request from ", userID, " to ", friendID);
            let friendRequestResponse = await prisma.friends.create({
                data: {
                    userID: userID,
                    friendID: friendID,
                    status: 'pending',
                },
            });
            console.log(friendRequestResponse, " ::: friendRequestResponse");
            return true;
        } catch (error) {
            logger.error(error);
            throw createHttpError(500, "Something went wrong while sending friend request");
        }
    }
}

export default FriendRepository;