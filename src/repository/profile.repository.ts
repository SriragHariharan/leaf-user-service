import createHttpError from "http-errors";
import prisma from "../helpers/prisma.helper";
import { IProfileRepository } from "../interfaces/IProfileRepository";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";

class ProfileRepository implements IUsernameRepository, IProfileRepository{
    
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
}

export default ProfileRepository;