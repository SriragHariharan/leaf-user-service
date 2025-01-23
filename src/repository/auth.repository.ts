import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import prisma from "../helpers/prisma.helper";
import createHttpError from "http-errors";

class AuthRepository implements IAuthRepository {
    /* create user */
    async create(authDetails: Auth): Promise<Auth> {
        try {
            const response = await prisma.user.create({
                data: {
                email: authDetails?.email!,
                password: authDetails?.password!,
                },
            });
            console.log("db insertion resp ::: ", response);
            return { id: response?.id, email: response?.email };
        } catch (error) {
            console.error("Error creating user:", error);
            throw new Error("Something went wrong. Please try again.");
        }
    }

    async findByEmail(email: string): Promise<Auth | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
            });
            return user;
        } catch (error) {
            console.error("Error finding user by email:", error);
            throw new Error("Something went wrong. Please try again.");
        }
    }

    async saveOTP({ userID, otp, expiresAt}: { userID: string; otp: number; expiresAt: Date; }): Promise<number> 
    {
        try {
            const otpString = otp.toString();
            const result = await prisma.oTP.upsert({
                where: { userID }, // Lookup by userID
                update: {
                    otp: otpString,
                    expiresAt,
                },
                create: {
                    userID,
                    otp: otpString,
                    expiresAt,
                },
            });
            return otp;
        } catch (error) {
            console.error("Error saving OTP:", error);
            throw new Error("Something went wrong. Please try again.");
        }
    }

    async getOTP(userID: string): Promise<{otp: string, expiresAt: Date, userID: string}> {
        try {
            const result = await prisma.oTP.findUnique({
                where: { userID }
            })
            return {otp: result?.otp!, expiresAt: result?.expiresAt!, userID: userID};
        } catch (error) {
            throw new Error("Something went wrong. Please try again.");
        }
    }

    async resetPassword(userID: string, password: string): Promise<boolean> {
        try {
            await prisma.user.update({
                where: { id: userID }, // Assuming the user is identified by 'id'
                data: {
                    password
                },
            });
            return true;
        } catch (error) {
            throw new Error("Something went wrong. Please try again.");   
        }
    }

    async saveOauthUser(email: string, provider: string, name: string, picture: string): Promise<Auth> {
         try {
            const response = await prisma.user.create({
                data: {
                    email: email!,
                    provider: provider!
                },
            });

            //update profile table with username and image
            await prisma.profile.create({
                data: {
                    userID: response?.id!,
                    username: name,
                    profilePicture: picture
                },
            });

            console.log("db insertion resp ::: ", response);
            return { id: response?.id, email: response?.email, provider, username: name, profilePicture: picture };
        } catch (error) {
            console.error("Error creating user:", error);
            throw new Error("Something went wrong. Please try again.");
        }
    }

    /* get basic profile details such as username and profile picture */
    async getBasicProfile(userID: string) {
    try {
        // Fetch the user's profile with only the specified fields
        const userProfile = await prisma.profile.findUnique({
            where: { userID },
            select: {
                username: true,
                profilePicture: true,
            },
        });

        if (!userProfile) {
            throw createHttpError(404, "Profile not found");
        }

        return userProfile; // Return the user's profile
    } catch (error) {
        console.error("Error fetching user:", error);
        throw new Error("Something went wrong. Please try again.");
    }
}
}

export default AuthRepository;