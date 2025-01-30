import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import prisma from "../helpers/prisma.helper";
import createHttpError from "http-errors";
import logger from "../helpers/logger";

class AuthRepository implements IAuthRepository {
    /* Create user */
    async create(authDetails: Auth): Promise<Auth> {
        try {
            logger.info(`Creating a new user in the database. Email: ${authDetails.email}`);
            const response = await prisma.user.create({
                data: {
                    email: authDetails.email!,
                    password: authDetails.password,
                },
            });

            logger.info(`User created successfully. ID: ${response.id}, Email: ${response.email}`);
            return { id: response.id, email: response.email };
        } catch (error) {
            logger.error(`Error creating user in the database. Email: ${authDetails.email}`, { error });
            throw new Error("Something went wrong. Please try again.");
        }
    }

    /* Find user by email */
    async findByEmail(email: string): Promise<Auth | null> {
        try {
            logger.info(`Searching for user by email. Email: ${email}`);
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (user) {
                logger.info(`User found by email. Email: ${email}`);
            } else {
                logger.warn(`User not found by email. Email: ${email}`);
            }

            return user;
        } catch (error) {
            logger.error(`Error finding user by email. Email: ${email}`, { error });
            throw new Error("Something went wrong. Please try again.");
        }
    }

    /* Save OTP */
    async saveOTP({ userID, otp, expiresAt }: { userID: string; otp: number; expiresAt: Date }): Promise<number> {
        try {
            logger.info(`Saving OTP for user. UserID: ${userID}`);
            const otpString = otp.toString();

            await prisma.oTP.upsert({
                where: { userID },
                update: { otp: otpString, expiresAt },
                create: { userID, otp: otpString, expiresAt },
            });

            logger.info(`OTP saved successfully for user. UserID: ${userID}`);
            return otp;
        } catch (error) {
            logger.error(`Error saving OTP for user. UserID: ${userID}`, { error });
            throw new Error("Something went wrong. Please try again.");
        }
    }

    /* Get OTP */
    async getOTP(userID: string): Promise<{ otp: string; expiresAt: Date; userID: string }> {
        try {
            logger.info(`Fetching OTP for user. UserID: ${userID}`);
            const result = await prisma.oTP.findUnique({
                where: { userID },
            });

            if (!result) {
                logger.warn(`OTP not found for user. UserID: ${userID}`);
                throw createHttpError(404, "OTP not found");
            }

            logger.info(`OTP fetched successfully for user. UserID: ${userID}`);
            return { otp: result.otp, expiresAt: result.expiresAt, userID };
        } catch (error) {
            logger.error(`Error fetching OTP for user. UserID: ${userID}`, { error });
            throw new Error("Something went wrong. Please try again.");
        }
    }

    /* Reset password */
    async resetPassword(userID: string, password: string): Promise<boolean> {
        try {
            logger.info(`Resetting password for user. UserID: ${userID}`);
            await prisma.user.update({
                where: { id: userID },
                data: { password },
            });

            logger.info(`Password reset successfully for user. UserID: ${userID}`);
            return true;
        } catch (error) {
            logger.error(`Error resetting password for user. UserID: ${userID}`, { error });
            throw new Error("Something went wrong. Please try again.");
        }
    }

    /* Save OAuth user */
    async saveOauthUser(email: string, provider: string, name: string, picture: string): Promise<Auth> {
        try {
            logger.info(`Saving OAuth user. Email: ${email}, Provider: ${provider}`);
            const response = await prisma.user.create({
                data: { email, provider },
            });

            logger.info(`OAuth user saved successfully. ID: ${response.id}, Email: ${response.email}`);

            // Update profile table with username and image
            logger.info(`Creating profile for OAuth user. UserID: ${response.id}`);
            await prisma.profile.create({
                data: {
                    userID: response.id,
                    username: name,
                    profilePicture: picture,
                },
            });

            logger.info(`Profile created successfully for OAuth user. UserID: ${response.id}`);
            return { id: response.id, email: response.email, provider, username: name, profilePicture: picture };
        } catch (error) {
            logger.error(`Error saving OAuth user. Email: ${email}`, { error });
            throw new Error("Something went wrong. Please try again.");
        }
    }

    /* Get basic profile details */
    async getBasicProfile(userID: string) {
        try {
            logger.info(`Fetching basic profile details for user. UserID: ${userID}`);
            const userProfile = await prisma.profile.findUnique({
                where: { userID },
                select: { username: true, profilePicture: true, userID: true },
            });

            if (!userProfile) {
                logger.warn(`Profile not found for user. UserID: ${userID}`);
                throw createHttpError(404, "Profile not found");
            }

            logger.info(`Basic profile details fetched successfully for user. UserID: ${userID}`);
            return userProfile;
        } catch (error) {
            logger.error(`Error fetching basic profile details for user. UserID: ${userID}`, { error });
            throw new Error("Something went wrong. Please try again.");
        }
    }
}

export default AuthRepository;