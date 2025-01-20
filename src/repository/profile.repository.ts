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
            throw new Error("Something went wrong. Please try again.");
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
            throw new Error("Unable to update username. Please try again.");
        }
    }
}

export default ProfileRepository;