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

        logger.info(`[FriendRepository] Successfully fetched ${users.length} users for userID: ${userID}`);
        return usersWithFriendStatus;

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

    async getFriendRequests(userID: string): Promise<any[] | null> {
        try {
            logger.info(`[FriendRepository] Fetching pending friend requests for userID: ${userID}`);
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
            return friendRequests;
        } catch (error) {
            logger.error(`[FriendRepository] Error fetching pending friend requests for userID: ${userID}`, { error });
            throw error;
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

async getFriendsList(userID: string, page: number): Promise<any[] | null> {
  try {
    logger.info(
      `[FriendRepository] Fetching friends list for userID: ${userID}, page: ${page}`
    );

    if (page < 1) {
      logger.warn(
        `[FriendRepository] Invalid page number: ${page}. Defaulting to page 1.`
      );
      page = 1;
    }

    const skip = (page - 1) * 35;

    // Fetch friend records where the status is accepted.
    // We include both relations:
    // - `User` (linked by the `userID` field)
    // - `FriendOf` (linked by the `friendID` field)
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
    // The logic is:
    // - If the logged-in user's ID appears in the `userID` field,
    //   then the friend is represented by the `FriendOf.Profile`.
    // - If it appears in the `friendID` field,
    //   then the friend is represented by the `User.Profile`.
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

    logger.info(
      `[FriendRepository] Successfully fetched ${friends.length} friends for userID: ${userID}, page: ${page}`
    );
    return mappedFriends;
  } catch (error) {
    logger.error(
      `[FriendRepository] Error fetching friends list for userID: ${userID}, page: ${page}`,
      error
    );
    throw createHttpError(500, "Failed to fetch friends list");
  }
}




    /* get all the IDs of friends as array for feed service */
    async getFriendIDs(userID: string): Promise<string[]> {
        try {
            logger.info(`[FriendRepository] Fetching friend IDs for userID: ${userID}`);
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

            logger.info(`[FriendRepository] Successfully fetched ${friendIDs.length} friend IDs for userID: ${userID}`);
            return friendIDs;
        } catch (error) {
            logger.error(`[FriendRepository] Error fetching friend IDs for userID: ${userID}`, error);
            throw createHttpError(500, "Failed to fetch friend IDs");
        }
    }
}

export default FriendRepository;