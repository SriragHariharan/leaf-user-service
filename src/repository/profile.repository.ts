import createHttpError from "http-errors";
import prisma from "../helpers/prisma.helper";
import { IProfileRepository } from "../interfaces/IProfileRepository";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";

class ProfileRepository implements IUsernameRepository, IProfileRepository{

    async getProfileDetails(userID: string): Promise<Object> {
        try {
            const userProfile = await prisma.profile.findUnique({
                where: { userID },
            });
            if(!userProfile) throw createHttpError(404, "User not found");
            return userProfile;
        } catch (error) {
            throw createHttpError(500, "Something went wrong.");
        }
    }
    
    async updateUsername(userID: string, username: string): Promise<string> {
        try {
            await prisma.profile.create({
                data: {
                    userID,
                    username
                },
            });
            return ""
        } catch (error) {
            console.error("Error updating user:", error);
            throw createHttpError(500, "Something went wrong.");
        }
    }

    async updateExistingUsername(username: string, userID: string): Promise<string> {
        try {
            const updatedUser  = await prisma.profile.update({
                where: {  userID },
                data: { username },
            });
            return updatedUser?.username;
        } catch (error) {
            console.error("Error updating existing user:", error);
            throw createHttpError(500, "Unable to update username.");
        }
    }

    /* update user description */
    async updateDescription(description: string, userID: string): Promise<string> {
        try {
            // Fetch the profile to get the existing username
            const existingUserProfile = await prisma.profile.findUnique({
                where: { userID },
            });

            if (!existingUserProfile) {
                throw createHttpError(404, "User profile not found.");
            }

            // Use upsert to update the description or create a new profile with the existing username
            const upsertedUser = await prisma.profile.upsert({
                where: { userID },
                update: { description },
                create: { userID, description, username: existingUserProfile.username },
            });
            return upsertedUser.description!;
        } catch (error) {
            console.error("Error updating or creating description:", error);
            throw createHttpError(500, "Unable to update description.");
        }
    }

    /* update user description */
    async updateLocation(location: string, userID: string): Promise<string> {
        try {
            // Fetch the profile to get the existing username
            const existingUserProfile = await prisma.profile.findUnique({
                where: { userID },
            });

            if (!existingUserProfile) {
                throw createHttpError(404, "User profile not found.");
            }

            const upsertedUser = await prisma.profile.upsert({
                where: { userID },
                update: { location },
                create: { userID, location, username: existingUserProfile.username },
            });
            return upsertedUser.location!;
        } catch (error) {
            console.error("Error updating or creating location:", error);
            throw createHttpError(500, "Unable to update location.");
        }
    }

    /* add travel history */
    async addTravelHistory(location: string, year: string, places: Array<string>, userID: string)
        : Promise<{ location: string; year: string; places: Array<string>, id: number }> 
        {
            try {
                const travelHistoryResponse = await prisma.travelHistory.create({
                    data: {
                        destination: location,
                        yearVisited: year,
                        userID
                    }
                });

                const travelHistoryID = travelHistoryResponse.id;

                // Create places entries
                const placesData = places.map(place => ({
                    travelHistoryID,
                    placeName: place
                }));

                // Insert places
                await prisma.places.createMany({ data: placesData });

                return {
                    id: travelHistoryID,
                    location: travelHistoryResponse.destination,
                    year: travelHistoryResponse.yearVisited,
                    places: places
                };
            } catch (error) {
                console.error("Error adding travel history:", error);
                throw createHttpError(500, "Unable to add travel history.");
            }
    }

    /* get travel history */
    async getTravelHistoryWithPlaces(userID: string) {
        try {
            const travelHistories = await prisma.travelHistory.findMany({
                where: { userID },
                include: {
                    Places: true,
                },
            });
            return travelHistories;
        } catch (error) {
            console.error("Error fetching travel history:", error);
            throw new Error("Unable to fetch travel history.");
        }
    }

    /* add bucket list */
    async addBucketList(userID: string, destination: string, notes: string): Promise<Object> {
        try {
            const bucketListEntry = await prisma.bucketList.create({
                data: {
                    userID,
                    destination,
                    notes,
                },
            });
            return bucketListEntry;
        } catch (error) {
            console.error("Error adding to bucket list:", error);
            throw new Error("Unable to add to bucket list.");
        }
    }

    /* get bucket list of a specific user */
    async getBucketList(userID: string): Promise<Object[]> {
        try {
            const bucketList = await prisma.bucketList.findMany({
                where: { userID },
            });
            return bucketList;
        } catch (error) {
            console.error("Error fetching user bucket list:", error);
            throw new Error("Unable to fetch user bucket list.");
        }
    }

    /* upload profile or cover picture */
    async updatePicture(userID: string, picture: string, type: string): Promise<boolean> {
        try {
            const updateData = type === 'profile' 
                ? { profilePicture: picture } 
                : type === 'cover' 
                ? { coverPicture: picture } 
                : null;

            if (!updateData) {
                throw new Error('Invalid type provided. Must be "profile" or "cover".');
            }

            // Update the profile in the database
            const updatedProfile = await prisma.profile.update({
                where: { userID },
                data: updateData,
            });

            // Check if the update was successful
            return updatedProfile ? true : false;
        } catch (error) {
            console.error('Error updating picture:', error);
            return false;
        }
    }
}

export default ProfileRepository;