import createHttpError from "http-errors";
import prisma from "../helpers/prisma.helper";
import { IProfileRepository } from "../interfaces/IProfileRepository";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";
import logger from "../helpers/logger";

class ProfileRepository implements IUsernameRepository, IProfileRepository {

    async getProfileDetails(userID: string): Promise<Object> {
        logger.debug(`Entering getProfileDetails method. Param: ${userID}`, { method: "getProfileDetails", layer: "repository" });
        try {
            logger.info(`Fetching profile details for userID: ${userID}`, { layer: "repository" });
            const userProfile = await prisma.profile.findUnique({
                where: { userID },
            });

            if (!userProfile) {
                logger.warn(`Profile not found for userID: ${userID}`, { layer: "repository" });
                throw createHttpError(404, "User not found");
            }

            logger.info(`Successfully fetched profile details for userID: ${userID}`, { layer: "repository" });
            return userProfile;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getProfileDetails. Param: ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in getProfileDetails. Param: ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Something went wrong.");
            }
        } finally {
            logger.debug(`Exiting getProfileDetails method. Param: ${userID}`, { method: "getProfileDetails", layer: "repository" });
        }
    }

    async updateUsername(userID: string, username: string): Promise<string> {
        logger.debug(`Entering updateUsername method. Params: ${userID}, ${username}`, { method: "updateUsername", layer: "repository" });
        try {
            logger.info(`Updating username for userID: ${userID}`, { layer: "repository" });
            await prisma.profile.create({
                data: {
                    userID,
                    username,
                },
            });

            logger.info(`Successfully updated username for userID: ${userID}`, { layer: "repository" });
            return "";
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updateUsername. Params: ${userID}, ${username}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateUsername. Params: ${userID}, ${username}`, { error, layer: "repository" });
                throw createHttpError(500, "Something went wrong.");
            }
        } finally {
            logger.debug(`Exiting updateUsername method. Params: ${userID}, ${username}`, { method: "updateUsername", layer: "repository" });
        }
    }

    async updateExistingUsername(username: string, userID: string): Promise<string> {
        logger.debug(`Entering updateExistingUsername method. Params: ${username}, ${userID}`, { method: "updateExistingUsername", layer: "repository" });
        try {
            logger.info(`Updating existing username for userID: ${userID}`, { layer: "repository" });
            const updatedUser = await prisma.profile.update({
                where: { userID },
                data: { username },
            });

            logger.info(`Successfully updated existing username for userID: ${userID}`, { layer: "repository" });
            return updatedUser?.username;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updateExistingUsername. Params: ${username}, ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateExistingUsername. Params: ${username}, ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Unable to update username.");
            }
        } finally {
            logger.debug(`Exiting updateExistingUsername method. Params: ${username}, ${userID}`, { method: "updateExistingUsername", layer: "repository" });
        }
    }

    async updateDescription(description: string, userID: string): Promise<string> {
        logger.debug(`Entering updateDescription method. Params: ${description}, ${userID}`, { method: "updateDescription", layer: "repository" });
        try {
            logger.info(`Updating description for userID: ${userID}`, { layer: "repository" });
            const existingUserProfile = await prisma.profile.findUnique({
                where: { userID },
            });

            if (!existingUserProfile) {
                logger.warn(`Profile not found for userID: ${userID}`, { layer: "repository" });
                throw createHttpError(404, "User profile not found.");
            }

            const upsertedUser = await prisma.profile.upsert({
                where: { userID },
                update: { description },
                create: { userID, description, username: existingUserProfile.username },
            });

            logger.info(`Successfully updated description for userID: ${userID}`, { layer: "repository" });
            return upsertedUser.description!;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updateDescription. Params: ${description}, ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateDescription. Params: ${description}, ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Unable to update description.");
            }
        } finally {
            logger.debug(`Exiting updateDescription method. Params: ${description}, ${userID}`, { method: "updateDescription", layer: "repository" });
        }
    }

    async updateLocation(location: string, userID: string): Promise<string> {
        logger.debug(`Entering updateLocation method. Params: ${location}, ${userID}`, { method: "updateLocation", layer: "repository" });
        try {
            logger.info(`Updating location for userID: ${userID}`, { layer: "repository" });
            const existingUserProfile = await prisma.profile.findUnique({
                where: { userID },
            });

            if (!existingUserProfile) {
                logger.warn(`Profile not found for userID: ${userID}`, { layer: "repository" });
                throw createHttpError(404, "User profile not found.");
            }

            const upsertedUser = await prisma.profile.upsert({
                where: { userID },
                update: { location },
                create: { userID, location, username: existingUserProfile.username },
            });

            logger.info(`Successfully updated location for userID: ${userID}`, { layer: "repository" });
            return upsertedUser.location!;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updateLocation. Params: ${location}, ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateLocation. Params: ${location}, ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Unable to update location.");
            }
        } finally {
            logger.debug(`Exiting updateLocation method. Params: ${location}, ${userID}`, { method: "updateLocation", layer: "repository" });
        }
    }

    async addTravelHistory(
        location: string,
        year: string,
        places: Array<string>,
        userID: string
    ): Promise<{ id: number; userID: string; destination: string; yearVisited: string; Places: { id: number; travelHistoryID: number; placeName: string }[] }> {
        logger.debug(`Entering addTravelHistory method. Params: ${location}, ${year}, ${places}, ${userID}`, { method: "addTravelHistory", layer: "repository" });
        try {
            logger.info(`Adding travel history for userID: ${userID}`, { layer: "repository" });
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
                logger.error(`Travel history not found for ID: ${travelHistoryID}`, { layer: "repository" });
                throw createHttpError(500, "Something went wrong");
            }

            logger.info(`Successfully added travel history for userID: ${userID}`, { layer: "repository" });
            return travelHistory;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in addTravelHistory. Params: ${location}, ${year}, ${places}, ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in addTravelHistory. Params: ${location}, ${year}, ${places}, ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Unable to add travel history.");
            }
        } finally {
            logger.debug(`Exiting addTravelHistory method. Params: ${location}, ${year}, ${places}, ${userID}`, { method: "addTravelHistory", layer: "repository" });
        }
    }

    async getTravelHistoryWithPlaces(userID: string) {
        logger.debug(`Entering getTravelHistoryWithPlaces method. Param: ${userID}`, { method: "getTravelHistoryWithPlaces", layer: "repository" });
        try {
            logger.info(`Fetching travel history for userID: ${userID}`, { layer: "repository" });
            const travelHistories = await prisma.travelHistory.findMany({
                where: { userID },
                include: {
                    Places: true,
                },
            });

            logger.info(`Successfully fetched travel history for userID: ${userID}`, { layer: "repository" });
            return travelHistories;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getTravelHistoryWithPlaces. Param: ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in getTravelHistoryWithPlaces. Param: ${userID}`, { error, layer: "repository" });
                throw new Error("Unable to fetch travel history.");
            }
        } finally {
            logger.debug(`Exiting getTravelHistoryWithPlaces method. Param: ${userID}`, { method: "getTravelHistoryWithPlaces", layer: "repository" });
        }
    }

    async addBucketList(userID: string, destination: string, notes: string): Promise<Object> {
        logger.debug(`Entering addBucketList method. Params: ${userID}, ${destination}, ${notes}`, { method: "addBucketList", layer: "repository" });
        try {
            logger.info(`Adding bucket list entry for userID: ${userID}`, { layer: "repository" });
            const bucketListEntry = await prisma.bucketList.create({
                data: {
                    userID,
                    destination,
                    notes,
                },
            });

            logger.info(`Successfully added bucket list entry for userID: ${userID}`, { layer: "repository" });
            return bucketListEntry;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in addBucketList. Params: ${userID}, ${destination}, ${notes}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in addBucketList. Params: ${userID}, ${destination}, ${notes}`, { error, layer: "repository" });
                throw new Error("Unable to add to bucket list.");
            }
        } finally {
            logger.debug(`Exiting addBucketList method. Params: ${userID}, ${destination}, ${notes}`, { method: "addBucketList", layer: "repository" });
        }
    }


    async getBucketList(userID: string): Promise<Object[]> {
        logger.debug(`Entering getBucketList method. Param: ${userID}`, { method: "getBucketList", layer: "repository" });
        try {
            logger.info(`Fetching bucket list for userID: ${userID}`, { layer: "repository" });
            const bucketList = await prisma.bucketList.findMany({
                where: { userID },
            });

            logger.info(`Successfully fetched bucket list for userID: ${userID}`, { layer: "repository" });
            return bucketList;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getBucketList. Param: ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in getBucketList. Param: ${userID}`, { error, layer: "repository" });
                throw new Error("Unable to fetch user bucket list.");
            }
        } finally {
            logger.debug(`Exiting getBucketList method. Param: ${userID}`, { method: "getBucketList", layer: "repository" });
        }
    }

    async updatePicture(userID: string, picture: string, type: string): Promise<boolean> {
        logger.debug(`Entering updatePicture method. Params: ${userID}, ${picture}, ${type}`, { method: "updatePicture", layer: "repository" });
        try {
            logger.info(`Updating ${type} picture for userID: ${userID}`, { layer: "repository" });
            const updateData = type === 'profile'
                ? { profilePicture: picture }
                : type === 'cover'
                ? { coverPicture: picture }
                : null;

            if (!updateData) {
                logger.error(`Invalid type provided: ${type}`, { layer: "repository" });
                throw new Error('Invalid type provided. Must be "profile" or "cover".');
            }

            const updatedProfile = await prisma.profile.update({
                where: { userID },
                data: updateData,
            });

            if (!updatedProfile) {
                logger.error(`Failed to update ${type} picture for userID: ${userID}`, { layer: "repository" });
                return false;
            }

            logger.info(`Successfully updated ${type} picture for userID: ${userID}`, { layer: "repository" });
            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updatePicture. Params: ${userID}, ${picture}, ${type}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in updatePicture. Params: ${userID}, ${picture}, ${type}`, { error, layer: "repository" });
                return false;
            }
        } finally {
            logger.debug(`Exiting updatePicture method. Params: ${userID}, ${picture}, ${type}`, { method: "updatePicture", layer: "repository" });
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
        logger.debug(`Entering reportUser method. Params: ${reporterID}, ${reportedID}, ${issue}, ${description}, ${priority}`, { method: "reportUser", layer: "repository" });
        try {
            logger.info(`Creating report for reportedID: ${reportedID} by reporterID: ${reporterID}`, { layer: "repository" });
            const report = await prisma.report.create({
                data: {
                    reporterID,
                    reportedID,
                    issue,
                    description,
                    priority,
                },
            });

            logger.info(`Successfully created report for reportedID: ${reportedID}`, { layer: "repository" });
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
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in reportUser. Params: ${reporterID}, ${reportedID}, ${issue}, ${description}, ${priority}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in reportUser. Params: ${reporterID}, ${reportedID}, ${issue}, ${description}, ${priority}`, { error, layer: "repository" });
                throw error;
            }
        } finally {
            logger.debug(`Exiting reportUser method. Params: ${reporterID}, ${reportedID}, ${issue}, ${description}, ${priority}`, { method: "reportUser", layer: "repository" });
        }
    }
}

export default ProfileRepository;