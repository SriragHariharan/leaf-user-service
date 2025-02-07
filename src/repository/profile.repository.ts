import createHttpError from "http-errors";
import prisma from "../helpers/prisma.helper";
import { IProfileRepository } from "../interfaces/IProfileRepository";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";
import logger from "../helpers/logger";

class ProfileRepository implements IUsernameRepository, IProfileRepository {

    async getProfileDetails(userID: string): Promise<Object> {
        try {
            logger.info(`Fetching profile details for userID: ${userID}`);
            const userProfile = await prisma.profile.findUnique({
                where: { userID },
            });

            if (!userProfile) {
                logger.warn(`Profile not found for userID: ${userID}`);
                throw createHttpError(404, "User not found");
            }

            logger.info(`Successfully fetched profile details for userID: ${userID}`);
            return userProfile;
        } catch (error) {
            logger.error(`Error fetching profile details for userID: ${userID}`, { error });
            throw createHttpError(500, "Something went wrong.");
        }
    }

    /* get profile details with friendship status */
    async getProfileDetailsWithFriendshipStatus(userID: string, profileID: string): Promise<Object> {
        try {
            logger.info(`Fetching profile details for profileID: ${profileID} by userID: ${userID}`);

            // Fetch the profile details for the given profileID.
            const userProfile = await prisma.profile.findUnique({
            where: { userID: profileID },
            });

            if (!userProfile) {
            logger.warn(`Profile not found for profileID: ${profileID}`);
            throw createHttpError(404, "User not found");
            }

            // Check if a friendship exists with either accepted or pending status between the two users.
            const friendship = await prisma.friends.findFirst({
            where: {
                OR: [
                    { userID: userID, friendID: profileID, status: { in: ['accepted', 'pending'] } },
                    { userID: profileID, friendID: userID, status: { in: ['accepted', 'pending'] } },
                ],
            },
            });

            let isFriend = false;
            let friendStatus = 'not_friend';
            let friendshipId = null;

            if (friendship) {
                friendshipId = friendship.id;
                if (friendship.status === 'accepted') {
                    isFriend = true;
                    friendStatus = 'friend';
                } else if (friendship.status === 'pending') {
                    friendStatus = 'pending';
                }
            }

            logger.info(`Successfully fetched profile details for profileID: ${profileID} with friendship status: ${friendStatus}`);
            return { ...userProfile, isFriend, friendStatus, friendshipId };
        } catch (error) {
            logger.error(`Error fetching profile details for profileID: ${profileID}`, { error });
            throw createHttpError(500, "Something went wrong.");
        }
    }


    async updateUsername(userID: string, username: string): Promise<string> {
        try {
            logger.info(`Updating username for userID: ${userID}`);
            await prisma.profile.create({
                data: {
                    userID,
                    username,
                },
            });

            logger.info(`Successfully updated username for userID: ${userID}`);
            return "";
        } catch (error) {
            logger.error(`Error updating username for userID: ${userID}`, { error });
            throw createHttpError(500, "Something went wrong.");
        }
    }

    async updateExistingUsername(username: string, userID: string): Promise<string> {
        try {
            logger.info(`Updating existing username for userID: ${userID}`);
            const updatedUser = await prisma.profile.update({
                where: { userID },
                data: { username },
            });

            logger.info(`Successfully updated existing username for userID: ${userID}`);
            return updatedUser?.username;
        } catch (error) {
            logger.error(`Error updating existing username for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to update username.");
        }
    }

    async updateDescription(description: string, userID: string): Promise<string> {
        try {
            logger.info(`Updating description for userID: ${userID}`);
            const existingUserProfile = await prisma.profile.findUnique({
                where: { userID },
            });

            if (!existingUserProfile) {
                logger.warn(`Profile not found for userID: ${userID}`);
                throw createHttpError(404, "User profile not found.");
            }

            const upsertedUser = await prisma.profile.upsert({
                where: { userID },
                update: { description },
                create: { userID, description, username: existingUserProfile.username },
            });

            logger.info(`Successfully updated description for userID: ${userID}`);
            return upsertedUser.description!;
        } catch (error) {
            logger.error(`Error updating description for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to update description.");
        }
    }

    async updateLocation(location: string, userID: string): Promise<string> {
        try {
            logger.info(`Updating location for userID: ${userID}`);
            const existingUserProfile = await prisma.profile.findUnique({
                where: { userID },
            });

            if (!existingUserProfile) {
                logger.warn(`Profile not found for userID: ${userID}`);
                throw createHttpError(404, "User profile not found.");
            }

            const upsertedUser = await prisma.profile.upsert({
                where: { userID },
                update: { location },
                create: { userID, location, username: existingUserProfile.username },
            });

            logger.info(`Successfully updated location for userID: ${userID}`);
            return upsertedUser.location!;
        } catch (error) {
            logger.error(`Error updating location for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to update location.");
        }
    }

    async addTravelHistory(
        location: string,
        year: string,
        places: Array<string>,
        userID: string
    ): Promise<{ id: number; userID: string; destination: string; yearVisited: string; Places: { id: number; travelHistoryID: number; placeName: string }[] }> {
        try {
            logger.info(`Adding travel history for userID: ${userID}`);
            const travelHistoryResponse = await prisma.travelHistory.create({
                data: {
                    destination: location,
                    yearVisited: year,
                    userID,
                },
            });

            const travelHistoryID = travelHistoryResponse.id;

            const placesData = places.map((place) => ({
                travelHistoryID,
                placeName: place,
            }));

            await prisma.places.createMany({ data: placesData });

            const travelHistory = await prisma.travelHistory.findUnique({
                where: { id: travelHistoryID },
                include: {
                    Places: true,
                },
            });

            if (!travelHistory) {
                logger.error(`Travel history not found for ID: ${travelHistoryID}`);
                throw createHttpError(500, "Something went wrong");
            }

            logger.info(`Successfully added travel history for userID: ${userID}`);
            return travelHistory;
        } catch (error) {
            logger.error(`Error adding travel history for userID: ${userID}`, { error });
            throw createHttpError(500, "Unable to add travel history.");
        }
    }

    async getTravelHistoryWithPlaces(userID: string) {
        try {
            logger.info(`Fetching travel history for userID: ${userID}`);
            const travelHistories = await prisma.travelHistory.findMany({
                where: { userID },
                include: {
                    Places: true,
                },
            });

            logger.info(`Successfully fetched travel history for userID: ${userID}`);
            return travelHistories;
        } catch (error) {
            logger.error(`Error fetching travel history for userID: ${userID}`, { error });
            throw new Error("Unable to fetch travel history.");
        }
    }

    async addBucketList(userID: string, destination: string, notes: string): Promise<Object> {
        try {
            logger.info(`Adding bucket list entry for userID: ${userID}`);
            const bucketListEntry = await prisma.bucketList.create({
                data: {
                    userID,
                    destination,
                    notes,
                },
            });

            logger.info(`Successfully added bucket list entry for userID: ${userID}`);
            return bucketListEntry;
        } catch (error) {
            logger.error(`Error adding bucket list entry for userID: ${userID}`, { error });
            throw new Error("Unable to add to bucket list.");
        }
    }

    async getBucketList(userID: string): Promise<Object[]> {
        try {
            logger.info(`Fetching bucket list for userID: ${userID}`);
            const bucketList = await prisma.bucketList.findMany({
                where: { userID },
            });

            logger.info(`Successfully fetched bucket list for userID: ${userID}`);
            return bucketList;
        } catch (error) {
            logger.error(`Error fetching bucket list for userID: ${userID}`, { error });
            throw new Error("Unable to fetch user bucket list.");
        }
    }

    async updatePicture(userID: string, picture: string, type: string): Promise<boolean> {
        try {
            logger.info(`Updating ${type} picture for userID: ${userID}`);
            const updateData = type === 'profile'
                ? { profilePicture: picture }
                : type === 'cover'
                ? { coverPicture: picture }
                : null;

            if (!updateData) {
                logger.error(`Invalid type provided: ${type}`);
                throw new Error('Invalid type provided. Must be "profile" or "cover".');
            }

            const updatedProfile = await prisma.profile.update({
                where: { userID },
                data: updateData,
            });

            if (!updatedProfile) {
                logger.error(`Failed to update ${type} picture for userID: ${userID}`);
                return false;
            }

            logger.info(`Successfully updated ${type} picture for userID: ${userID}`);
            return true;
        } catch (error) {
            logger.error(`Error updating ${type} picture for userID: ${userID}`, { error });
            return false;
        }
    }

    /* report a profile */
    async reportUser(
        reporterID: string,  
        reportedID: string, 
        issue: string, 
        description?: string, 
        priority: string = "low"
    ): Promise<{ 
        id: number; 
        reporterID: string; 
        reportedID: string; 
        issue: string; 
        description?: string | undefined; 
        priority: string; 
        createdAt: Date; 
        status: string; 
        updatedAt: Date; 
    }> {
        try {
            const report = await prisma.report.create({
                data: {
                    reporterID,
                    reportedID,
                    issue,
                    description,
                    priority,
                },
            });

            console.log("Report created successfully:", report);
            return {
                id: report.id,
                reporterID: report.reporterID,
                reportedID: report.reportedID,
                issue: report.issue,
                description: report.description ?? undefined,
                priority: report.priority,
                createdAt: report.createdAt,
                status: report.status,
                updatedAt: report.updatedAt,
            };
        } catch (error) {
            console.error("Error creating report:", error);
            throw error;
        }
    }
}

export default ProfileRepository;