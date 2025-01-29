import createHttpError from "http-errors";
import logger from "../helpers/logger";
import prisma from "../helpers/prisma.helper";
import { IFriendRepository } from "../interfaces/IFriendRepository";
import { User } from "../interfaces/auth.interface";

class FriendRepository implements IFriendRepository {

    async searchUsersByName(search: string, userID: string): Promise<User[]> {
        try {
            logger.info(`[FriendRepository] Searching for users with query: "${search}" for userID: ${userID}`);
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
            logger.info(`[FriendRepository] Successfully fetched ${users.length} users for userID: ${userID}`);
            return users;

        } catch (error) {
            logger.error(`[FriendRepository] Error searching users for userID: ${userID}`, error);
            throw new Error("Failed to search users");
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
            logger.info(`[FriendRepository] Checking existing friend request from userID: ${userID} to friendID: ${friendID}`);
            const existingRequest = await prisma.friends.findFirst({
                where: {
                    userID: userID,
                    friendID: friendID
                },
            });
            if (existingRequest) {
                logger.info(`[FriendRepository] Found existing friend request with ID: ${existingRequest.id}`);
            } else {
                logger.info(`[FriendRepository] No existing friend request found from userID: ${userID} to friendID: ${friendID}`);
            }
            return existingRequest;
        } catch (error) {
            logger.error(`[FriendRepository] Error checking existing friend request from userID: ${userID} to friendID: ${friendID}`, error);
            throw createHttpError(500, "Failed to check existing friend request");
        }
    }

    async sendFriendRequest(userID: string, friendID: string): Promise<boolean> {
        try {
            logger.info(`[FriendRepository] Sending friend request from userID: ${userID} to friendID: ${friendID}`);
            const friendRequestResponse = await prisma.friends.create({
                data: {
                    userID: userID,
                    friendID: friendID,
                    status: 'pending',
                },
            });
            logger.info(`[FriendRepository] Successfully sent friend request with ID: ${friendRequestResponse.id}`);
            return true;
        } catch (error) {
            logger.error(`[FriendRepository] Error sending friend request from userID: ${userID} to friendID: ${friendID}`, error);
            throw createHttpError(500, "Failed to send friend request");
        }
    }

    async getFriendRequests(userID: string): Promise<User[] | null> {
        try {
            logger.info(`[FriendRepository] Fetching pending friend requests for userID: ${userID}`);
            const friendRequests = await prisma.friends.findMany({
                where: {
                    friendID: userID, // The user who received the requests
                    status: 'pending', // Only fetch pending requests
                },
                include: {
                    Profile: {
                        select: {
                            userID: true,
                            username: true,
                            profilePicture: true,
                            description: true
                        },
                    },
                },
            });
            logger.info(`[FriendRepository] Successfully fetched ${friendRequests.length} pending friend requests for userID: ${userID}`);
            return friendRequests;
        } catch (error) {
            logger.error(`[FriendRepository] Error fetching friend requests for userID: ${userID}`, error);
            throw createHttpError(500, "Failed to fetch friend requests");
        }
    }

    async acceptFriendRequest(friendRequestID: number, userID: string)
        : Promise<{ id: number; userID: string; friendID: string; status: string; createdAt: Date; }> 
        {
        try {
            logger.info(`[FriendRepository] Accepting friend request with ID: ${friendRequestID}`);
            let acceptedResponse = await prisma.friends.update({
                where: {
                    id: friendRequestID, 
                    friendID: userID
                },
                data: {
                    status: 'accepted',
                },
            });
            logger.info(`[FriendRepository] Successfully accepted friend request with ID: ${friendRequestID}`);
            return acceptedResponse;
        } catch (error) {
            logger.error(`[FriendRepository] Error accepting friend request with ID: ${friendRequestID}`, error);
            throw createHttpError(500, "Failed to accept friend request");
        }
    }

    async rejectFriendRequest(friendRequestID: number, userID: string)
        : Promise<{ id: number; userID: string; friendID: string; status: string; createdAt: Date; }> 
        {
        try {
            logger.info(`[FriendRepository] Rejecting friend request with ID: ${friendRequestID}`);
            let rejectedResponse = await prisma.friends.delete({
                where: {
                    id: friendRequestID,
                },
            });
            logger.info(`[FriendRepository] Rejected friend request with ID: ${friendRequestID}`);
            return rejectedResponse;
        } catch (error) {
            logger.error(`[FriendRepository] Error rejecting friend request with ID: ${friendRequestID}`, error);
            throw createHttpError(500, "Failed to reject friend request");
        }
    }

    async getTotalFriendsCount(userID: string): Promise<number | null> {
        try {
            const totalFriends = await prisma.friends.count({
                where: {
                    OR: [
                        { userID:   userID, status: "accepted" },
                        { friendID: userID, status: "accepted" },
                    ],
                },
            });
            return totalFriends;
        } catch (error) {
            logger.error(`[FriendRepository] Error finding friends count for userID: ${userID}`, error);
            throw createHttpError(500, "Failed to get total friends count");
        }
    }

    async getFriendsList(userID: string, page: number): Promise<User[] | null> {
    try {
        logger.info(`[FriendRepository] Fetching friends list for userID: ${userID}, page: ${page}`);

        if (page < 1) {
            logger.warn(`[FriendRepository] Invalid page number: ${page}. Defaulting to page 1.`);
            page = 1;
        }

        const skip = (page - 1) * 35; // Calculate skip value for pagination

        const friends = await prisma.friends.findMany({
            where: {
                OR: [
                    { userID: userID, status: "accepted" },
                    { friendID: userID, status: "accepted" },
                ],
            },
            include: {
                Profile: {
                    select: {
                        userID: true,
                        username: true,
                        profilePicture: true,
                        description: true,
                    },
                },
            },
            skip: skip, // Skip records for pagination
            take: 35, // Limit to 35 records per page
        });

        logger.info(`[FriendRepository] Successfully fetched ${friends.length} friends for userID: ${userID}, page: ${page}`);
        return friends;
    } catch (error) {
        logger.error(`[FriendRepository] Error fetching friends list for userID: ${userID}, page: ${page}`, error);
        throw createHttpError(500, "Failed to fetch friends list");
    }
}
}

export default FriendRepository;