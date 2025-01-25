import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import prisma from "../helpers/prisma.helper";
import createHttpError from "http-errors";
import logger from "../helpers/logger";

class AuthRepository implements IAuthRepository {
    /* create user */
    async create(authDetails: Auth): Promise<Auth> {
        try {
            logger.info("AuthRepository: Creating a new user at database: %s",authDetails?.email )
            const response = await prisma.user.create({
                data: {
                    email: authDetails?.email!,
                    password: authDetails?.password!,
                },
            });
            console.log("db insertion resp ::: ", response);
            logger.info("New ser added to the database: %s",{id: response?.id, email: response?.email})
            return { id: response?.id, email: response?.email };
        } catch (error) {
            logger.error("Error creating new user at database: %s",error);
            throw new Error("Something went wrong. Please try again.");
        }
    }

    async findByEmail(email: string): Promise<Auth | null> {
        try {
            logger.info("Searching for user by email in database: %s", email);
            const user = await prisma.user.findUnique({
                where: { email },
            });
            logger.info("Found user by email in database: %s", email);
            return user;
        } catch (error) {
            logger.error("Error finding user by email in database: %s, Error: %s", email, error);
            throw new Error("Something went wrong. Please try again.");
        }
    }

    async saveOTP({ userID, otp, expiresAt}: { userID: string; otp: number; expiresAt: Date; }): Promise<number> 
    {
        try {
            logger.info("Saving the generated otp to database for user: %s", userID);
            const otpString = otp.toString();
            await prisma.oTP.upsert({
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
            logger.info("Saved the generated otp to database for user: %s", userID);
            return otp;
        } catch (error) {
            logger.error("Error saving OTP for the userID: %s", userID,  error);
            throw new Error("Something went wrong. Please try again.");
        }
    }

    async getOTP(userID: string): Promise<{otp: string, expiresAt: Date, userID: string}> {
        try {
            logger.info("finding the otp for user in database" + userID);
            const result = await prisma.oTP.findUnique({
                where: { userID }
            })
            return {otp: result?.otp!, expiresAt: result?.expiresAt!, userID: userID};
        } catch (error) {
            logger.error("Error finding the otp for user: %s", userID, error)
            throw new Error("Something went wrong. Please try again.");
        }
    }

    async resetPassword(userID: string, password: string): Promise<boolean> {
        logger.info("Saving new password for user: %s" + userID);
        try {
            await prisma.user.update({
                where: { id: userID },
                data: {
                    password
                },
            });
            logger.info("Saved new password for user: %s" + userID);
            return true;
        } catch (error) {
            logger.error("Unable to save new password for user: %s", userID, error);
            throw new Error("Something went wrong. Please try again.");   
        }
    }

    async saveOauthUser(email: string, provider: string, name: string, picture: string): Promise<Auth> {
         try {
            logger.info("Saving user authenticated via oauth platform with email: %s", email, " provider: %s", provider);
            const response = await prisma.user.create({
                data: {
                    email: email!,
                    provider: provider!
                },
            });
            logger.info("Saved user authenticated via oauth platform with email: %s", email, " provider: %s", provider);

            //update profile table with username and image
            logger.info("Saving username and profile image for the user with email: %s", email, " provider: %s", provider);
            await prisma.profile.create({
                data: {
                    userID: response?.id!,
                    username: name,
                    profilePicture: picture
                },
            });
            logger.info("Saved username and profile image for the user with email: %s", email, " provider: %s", provider);

            return { id: response?.id, email: response?.email, provider, username: name, profilePicture: picture };
        } catch (error) {
            logger.error("Error saving oAuth user credentilas: %s", email,  error)
            throw new Error("Something went wrong. Please try again.");
        }
    }

    /* get basic profile details such as username and profile picture */
    async getBasicProfile(userID: string) {
    try {
        logger.info("Getting basic profile information for the userID: %s", userID);
        // Fetch the user's profile with only the specified fields
        const userProfile = await prisma.profile.findUnique({
            where: { userID },
            select: {
                username: true,
                profilePicture: true,
            },
        });

        if (!userProfile) {
            logger.warn("Profile details not found in the database for the userID", userID);
            throw createHttpError(404, "Profile not found");
        }
        logger.info("User profile fetched from database for the userID: %s", userID);
        return userProfile;
    } catch (error) {
        logger.error("Error fuctcing basic profile of the userID: %s", userID, error);
        throw new Error("Something went wrong. Please try again.");
    }
}
}

export default AuthRepository;