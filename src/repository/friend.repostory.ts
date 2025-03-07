import createHttpError from "http-errors";
import logger from "../helpers/logger";
import prisma from "../helpers/prisma.helper";
import { IFriendRepository } from "../interfaces/IFriendRepository";
import { User } from "../interfaces/auth.interface";

class FriendRepository implements IFriendRepository {

    /* Search for users by name and return their profiles with friend status */
    async searchUsersByName(search: string, userID: string): Promise<User[]> {
        logger.debug(`Entering searchUsersByName method. Params: ${search}, ${userID}`, { method: "searchUsersByName", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Searching for users with query: "${search}" for userID: ${userID}`, { layer: "repository" });
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
                    User: {
                        select: {
                            Friends: {
                                where: {
                                    OR: [
                                        { userID: userID }, // Check if the current user is the friend
                                        { friendID: userID }, // Check if the current user is the friend of
                                    ],
                                },
                                select: {
                                    id: true,
                                    status: true,
                                    friendID: true,
                                    userID: true,
                                },
                            },
                        },
                    },
                },
            });

            // Map the results to include a `isFriend` flag and `friendStatus` flag
            const usersWithFriendStatus = users.map((user) => {
                const friend = user.User.Friends.find((friendship) => {
                    return (friendship.userID === userID && friendship.friendID === user.userID) ||
                            (friendship.userID === user.userID && friendship.friendID === userID);
                });

                let isFriend = false;
                let friendStatus = 'not_friend'; // not_friend, pending, accepted

                if (friend) {
                    if (friend.status === 'accepted') {
                        isFriend = true;
                        friendStatus = 'accepted';
                    } else if (friend.status === 'pending') {
                        friendStatus = 'pending';
                    }
                }

                return {
                    ...user,
                    isFriend,
                    friendStatus,
                };
            });

            logger.info(`[FriendRepository] Successfully fetched ${users.length} users for userID: ${userID}`, { layer: "repository" });
            return usersWithFriendStatus;
        } catch (error) {
            logger.error(`[FriendRepository] Error searching users for userID: ${userID}`, { error, layer: "repository" });
            throw new Error("Failed to search users");
        } finally {
            logger.debug(`Exiting searchUsersByName method. Params: ${search}, ${userID}`, { method: "searchUsersByName", layer: "repository" });
        }
    }

    /* Check if a friend request already exists between two users */
    async checkExistingRequest(userID: string, friendID: string)
        : Promise<{ 
            id: number; 
            userID: string; 
            createdAt: Date; 
            friendID: string; 
            status: string 
        } | null> 
    {
        logger.debug(`Entering checkExistingRequest method. Params: ${userID}, ${friendID}`, { method: "checkExistingRequest", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Checking existing friend request from userID: ${userID} to friendID: ${friendID}`, { layer: "repository" });
            const existingRequest = await prisma.friends.findFirst({
                where: {
                    userID: userID,
                    friendID: friendID
                },
            });
            if (existingRequest) {
                logger.info(`[FriendRepository] Found existing friend request with ID: ${existingRequest.id}`, { layer: "repository" });
            } else {
                logger.info(`[FriendRepository] No existing friend request found from userID: ${userID} to friendID: ${friendID}`, { layer: "repository" });
            }
            return existingRequest;
        } catch (error) {
            logger.error(`[FriendRepository] Error checking existing friend request from userID: ${userID} to friendID: ${friendID}`, { error, layer: "repository" });
            throw createHttpError(500, "Failed to check existing friend request");
        } finally {
            logger.debug(`Exiting checkExistingRequest method. Params: ${userID}, ${friendID}`, { method: "checkExistingRequest", layer: "repository" });
        }
    }

    /* Send a friend request from one user to another */
    async sendFriendRequest(userID: string, friendID: string): Promise<boolean> {
        logger.debug(`Entering sendFriendRequest method. Params: ${userID}, ${friendID}`, { method: "sendFriendRequest", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Sending friend request from userID: ${userID} to friendID: ${friendID}`, { layer: "repository" });
            const friendRequestResponse = await prisma.friends.create({
                data: {
                    userID: userID,
                    friendID: friendID,
                    status: 'pending',
                },
            });
            logger.info(`[FriendRepository] Successfully sent friend request with ID: ${friendRequestResponse.id}`, { layer: "repository" });
            return true;
        } catch (error) {
            logger.error(`[FriendRepository] Error sending friend request from userID: ${userID} to friendID: ${friendID}`, { error, layer: "repository" });
            throw createHttpError(500, "Failed to send friend request");
        } finally {
            logger.debug(`Exiting sendFriendRequest method. Params: ${userID}, ${friendID}`, { method: "sendFriendRequest", layer: "repository" });
        }
    }

    /* Get all pending friend requests for a user */
    async getFriendRequests(userID: string): Promise<any[] | null> {
        logger.debug(`Entering getFriendRequests method. Param: ${userID}`, { method: "getFriendRequests", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Fetching pending friend requests for userID: ${userID}`, { layer: "repository" });
            const friendRequests = await prisma.friends.findMany({
                where: {
                    friendID: userID,
                    status: 'pending',
                    // Exclude requests that you initiated yourself
                    userID: { not: userID },
                },
                include: {
                    // Include the profile of the sender (the one who initiated the request)
                    Profile: {
                        select: {
                            userID: true,
                            username: true,
                            profilePicture: true,
                            description: true,
                        },
                    },
                },
            });
            logger.info(`[FriendRepository] Successfully fetched ${friendRequests.length} pending friend requests for userID: ${userID}`, { layer: "repository" });
            return friendRequests;
        } catch (error) {
            logger.error(`[FriendRepository] Error fetching pending friend requests for userID: ${userID}`, { error, layer: "repository" });
            throw error;
        } finally {
            logger.debug(`Exiting getFriendRequests method. Param: ${userID}`, { method: "getFriendRequests", layer: "repository" });
        }
    }

    /* Accept a friend request */
    async acceptFriendRequest(friendRequestID: number, userID: string)
        : Promise<{ id: number; userID: string; friendID: string; status: string; createdAt: Date; }> 
    {
        logger.debug(`Entering acceptFriendRequest method. Params: ${friendRequestID}, ${userID}`, { method: "acceptFriendRequest", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Accepting friend request with ID: ${friendRequestID}`, { layer: "repository" });
            let acceptedResponse = await prisma.friends.update({
                where: {
                    id: friendRequestID, 
                    friendID: userID
                },
                data: {
                    status: 'accepted',
                },
            });
            logger.info(`[FriendRepository] Successfully accepted friend request with ID: ${friendRequestID}`, { layer: "repository" });
            return acceptedResponse;
        } catch (error) {
            logger.error(`[FriendRepository] Error accepting friend request with ID: ${friendRequestID}`, { error, layer: "repository" });
            throw createHttpError(500, "Failed to accept friend request");
        } finally {
            logger.debug(`Exiting acceptFriendRequest method. Params: ${friendRequestID}, ${userID}`, { method: "acceptFriendRequest", layer: "repository" });
        }
    }

    /* Reject a friend request */
    async rejectFriendRequest(friendRequestID: number, userID: string)
        : Promise<{ id: number; userID: string; friendID: string; status: string; createdAt: Date; }> 
    {
        logger.debug(`Entering rejectFriendRequest method. Params: ${friendRequestID}, ${userID}`, { method: "rejectFriendRequest", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Rejecting friend request with ID: ${friendRequestID}`, { layer: "repository" });
            let rejectedResponse = await prisma.friends.delete({
                where: {
                    id: friendRequestID,
                },
            });
            logger.info(`[FriendRepository] Rejected friend request with ID: ${friendRequestID}`, { layer: "repository" });
            return rejectedResponse;
        } catch (error) {
            logger.error(`[FriendRepository] Error rejecting friend request with ID: ${friendRequestID}`, { error, layer: "repository" });
            throw createHttpError(500, "Failed to reject friend request");
        } finally {
            logger.debug(`Exiting rejectFriendRequest method. Params: ${friendRequestID}, ${userID}`, { method: "rejectFriendRequest", layer: "repository" });
        }
    }

    /* Get the total count of friends for a user */
    async getTotalFriendsCount(userID: string): Promise<number | null> {
        logger.debug(`Entering getTotalFriendsCount method. Param: ${userID}`, { method: "getTotalFriendsCount", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Fetching total friends count for userID: ${userID}`, { layer: "repository" });
            const totalFriends = await prisma.friends.count({
                where: {
                    OR: [
                        { userID: userID, status: "accepted" },
                        { friendID: userID, status: "accepted" },
                    ],
                },
            });
            logger.info(`[FriendRepository] Successfully fetched total friends count: ${totalFriends} for userID: ${userID}`, { layer: "repository" });
            return totalFriends;
        } catch (error) {
            logger.error(`[FriendRepository] Error finding friends count for userID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Failed to get total friends count");
        } finally {
            logger.debug(`Exiting getTotalFriendsCount method. Param: ${userID}`, { method: "getTotalFriendsCount", layer: "repository" });
        }
    }

    /* Get a paginated list of friends for a user */
    async getFriendsList(userID: string, page: number): Promise<any[] | null> {
        logger.debug(`Entering getFriendsList method. Params: ${userID}, ${page}`, { method: "getFriendsList", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Fetching friends list for userID: ${userID}, page: ${page}`, { layer: "repository" });

            if (page < 1) {
                logger.warn(`[FriendRepository] Invalid page number: ${page}. Defaulting to page 1.`, { layer: "repository" });
                page = 1;
            }

            const skip = (page - 1) * 35;

            // Fetch friend records where the status is accepted.
            const friends = await prisma.friends.findMany({
                where: {
                    OR: [
                        { userID: userID, status: "accepted" },
                        { friendID: userID, status: "accepted" },
                    ],
                },
                include: {
                    User: {
                        select: {
                            Profile: {
                                select: {
                                    userID: true,
                                    username: true,
                                    profilePicture: true,
                                    description: true,
                                },
                            },
                        },
                    },
                    FriendOf: {
                        select: {
                            Profile: {
                                select: {
                                    userID: true,
                                    username: true,
                                    profilePicture: true,
                                    description: true,
                                },
                            },
                        },
                    },
                },
                skip,
                take: 35,
            });

            // Map each friend record to attach the correct friend's profile.
            const mappedFriends = friends.map((friend) => {
                let friendProfile = null;
                if (friend.userID === userID) {
                    friendProfile = friend.FriendOf?.Profile;
                } else if (friend.friendID === userID) {
                    friendProfile = friend.User?.Profile;
                }
                return {
                    ...friend,
                    friendProfile,
                };
            });

            logger.info(`[FriendRepository] Successfully fetched ${friends.length} friends for userID: ${userID}, page: ${page}`, { layer: "repository" });
            return mappedFriends;
        } catch (error) {
            logger.error(`[FriendRepository] Error fetching friends list for userID: ${userID}, page: ${page}`, { error, layer: "repository" });
            throw createHttpError(500, "Failed to fetch friends list");
        } finally {
            logger.debug(`Exiting getFriendsList method. Params: ${userID}, ${page}`, { method: "getFriendsList", layer: "repository" });
        }
    }

    /* Get all friend IDs for a user (used for feed service) */
    async getFriendIDs(userID: string): Promise<string[]> {
        logger.debug(`Entering getFriendIDs method. Param: ${userID}`, { method: "getFriendIDs", layer: "repository" });
        try {
            logger.info(`[FriendRepository] Fetching friend IDs for userID: ${userID}`, { layer: "repository" });
            const friends = await prisma.friends.findMany({
                where: {
                    OR: [
                        { userID: userID, status: "accepted" },
                        { friendID: userID, status: "accepted" },
                    ],
                },
                select: {
                    userID: true,
                    friendID: true,
                },
            });

            const friendIDs = friends.map((friend) => {
                if (friend.userID === userID) {
                    return friend.friendID;
                } else {
                    return friend.userID;
                }
            });

            logger.info(`[FriendRepository] Successfully fetched ${friendIDs.length} friend IDs for userID: ${userID}`, { layer: "repository" });
            return friendIDs;
        } catch (error) {
            logger.error(`[FriendRepository] Error fetching friend IDs for userID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Failed to fetch friend IDs");
        } finally {
            logger.debug(`Exiting getFriendIDs method. Param: ${userID}`, { method: "getFriendIDs", layer: "repository" });
        }
    }
}

export default FriendRepository;