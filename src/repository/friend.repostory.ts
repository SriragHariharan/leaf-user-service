import createHttpError from "http-errors";
import logger from "../helpers/logger";
import prisma from "../helpers/prisma.helper";
import { IFriendRepository } from "../interfaces/IFriendRepository";
import { User } from "../interfaces/auth.interface";

class FriendRepository implements IFriendRepository{


    async searchUsersByName(search: string, userID: string): Promise<User[]> {
        try {
            logger.info("Searching for users based on query string: " + search);
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
            logger.info("User fetched from db for user: " + userID);
            return users;

        } catch (error) {
            logger.error(error);
            throw new Error("something went wrong searching users");
        }
    }
}

export default FriendRepository;