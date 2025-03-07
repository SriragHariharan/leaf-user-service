import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import prisma from "../helpers/prisma.helper";
import createHttpError from "http-errors";
import logger from "../helpers/logger";

class AuthRepository implements IAuthRepository {
    
    /* Create user */
    async create(authDetails: Auth): Promise<Auth> {
        logger.debug("Entering create method", { method: "create", layer: "repository", email: authDetails.email });
        try {
            logger.info(`Creating a new user in the database. Email: ${authDetails.email}`, { layer: "repository" });
            const response = await prisma.user.create({
                data: {
                    email: authDetails.email!,
                    password: authDetails.password,
                },
            });

            logger.info(`User created successfully. ID: ${response.id}, Email: ${response.email}`, { layer: "repository" });
            return { id: response.id, email: response.email };
        } catch (error) {
            logger.error(`Error creating user in the database. Email: ${authDetails.email}`, { method: "create", layer: "repository", email: authDetails.email, error });
            throw new Error("Something went wrong. Please try again.");
        } finally {
            logger.debug("Exiting create method", { method: "create", layer: "repository" });
        }
    }

    /* Find user by email */
    async findByEmail(email: string): Promise<Auth | null> {
        logger.debug("Entering findByEmail method", { method: "findByEmail", layer: "repository", email });
        try {
            logger.info(`Searching for user by email. Email: ${email}`, { layer: "repository" });
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (user) {
                logger.info(`User found by email. Email: ${email}`, { layer: "repository" });
            } else {
                logger.warn(`User not found by email. Email: ${email}`, { layer: "repository" });
            }

            return user;
        } catch (error) {
            logger.error(`Error finding user by email. Email: ${email}`, { method: "findByEmail", layer: "repository", email, error });
            throw new Error("Something went wrong. Please try again.");
        } finally {
            logger.debug("Exiting findByEmail method", { method: "findByEmail", layer: "repository" });
        }
    }

    /* Save OTP */
    async saveOTP({ userID, otp, expiresAt }: { userID: string; otp: number; expiresAt: Date }): Promise<number> {
        logger.debug("Entering saveOTP method", { method: "saveOTP", layer: "repository", userID });
        try {
            logger.info(`Saving OTP for user. UserID: ${userID}`, { layer: "repository" });
            const otpString = otp.toString();

            await prisma.oTP.upsert({
                where: { userID },
                update: { otp: otpString, expiresAt },
                create: { userID, otp: otpString, expiresAt },
            });

            logger.info(`OTP saved successfully for user. UserID: ${userID}`, { layer: "repository" });
            return otp;
        } catch (error) {
            logger.error(`Error saving OTP for user. UserID: ${userID}`, { method: "saveOTP", layer: "repository", userID, error });
            throw new Error("Something went wrong. Please try again.");
        } finally {
            logger.debug("Exiting saveOTP method", { method: "saveOTP", layer: "repository" });
        }
    }

    /* Get OTP */
    async getOTP(userID: string): Promise<{ otp: string; expiresAt: Date; userID: string }> {
        logger.debug("Entering getOTP method", { method: "getOTP", layer: "repository", userID });
        try {
            logger.info(`Fetching OTP for user. UserID: ${userID}`, { layer: "repository" });
            const result = await prisma.oTP.findUnique({
                where: { userID },
            });

            if (!result) {
                logger.warn(`OTP not found for user. UserID: ${userID}`, { layer: "repository" });
                throw createHttpError(404, "OTP not found");
            }

            logger.info(`OTP fetched successfully for user. UserID: ${userID}`, { layer: "repository" });
            return { otp: result.otp, expiresAt: result.expiresAt, userID };
        } catch (error) {
            logger.error(`Error fetching OTP for user. UserID: ${userID}`, { method: "getOTP", layer: "repository", userID, error });
            throw new Error("Something went wrong. Please try again.");
        } finally {
            logger.debug("Exiting getOTP method", { method: "getOTP", layer: "repository" });
        }
    }

    /* Reset password */
    async resetPassword(userID: string, password: string): Promise<boolean> {
        logger.debug("Entering resetPassword method", { method: "resetPassword", layer: "repository", userID });
        try {
            logger.info(`Resetting password for user. UserID: ${userID}`, { layer: "repository" });
            await prisma.user.update({
                where: { id: userID },
                data: { password },
            });

            logger.info(`Password reset successfully for user. UserID: ${userID}`, { layer: "repository" });
            return true;
        } catch (error) {
            logger.error(`Error resetting password for user. UserID: ${userID}`, { method: "resetPassword", layer: "repository", userID, error });
            throw new Error("Something went wrong. Please try again.");
        } finally {
            logger.debug("Exiting resetPassword method", { method: "resetPassword", layer: "repository" });
        }
    }

    /* Save OAuth user */
    async saveOauthUser(email: string, provider: string, name: string, picture: string): Promise<Auth> {
        logger.debug("Entering saveOauthUser method", { method: "saveOauthUser", layer: "repository", email });
        try {
            logger.info(`Saving OAuth user. Email: ${email}, Provider: ${provider}`, { layer: "repository" });
            const response = await prisma.user.create({
                data: { email, provider },
            });

            logger.info(`OAuth user saved successfully. ID: ${response.id}, Email: ${response.email}`, { layer: "repository" });
            logger.info(`Creating profile for OAuth user. UserID: ${response.id}`, { layer: "repository" });
            await prisma.profile.create({
                data: {
                    userID: response.id,
                    username: name,
                    profilePicture: picture,
                },
            });

            logger.info(`Profile created successfully for OAuth user. UserID: ${response.id}`, { layer: "repository" });
            return { id: response.id, email: response.email, provider, username: name, profilePicture: picture };
        } catch (error) {
            logger.error(`Error saving OAuth user. Email: ${email}`, { method: "saveOauthUser", layer: "repository", email, error });
            throw new Error("Something went wrong. Please try again.");
        } finally {
            logger.debug("Exiting saveOauthUser method", { method: "saveOauthUser", layer: "repository" });
        }
    }

    /* Get basic profile details */
    async getBasicProfile(userID: string) {
        logger.debug("Entering getBasicProfile method", { method: "getBasicProfile", layer: "repository", userID });
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
        } finally {
            logger.debug("Exiting getBasicProfile method", { method: "getBasicProfile", layer: "repository", userID });
        }
    }


    /* get email id of a specific user */
    async getEmailByUserId(userId: string): Promise<string> {
        logger.debug("Entering getEmailByUserId method", { method: "getEmailByUserId", layer: "repository", userId });
        try {
            logger.info(`Fetching email for user. UserID: ${userId}`);
            const email = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true },
            });

            if (!email) {
                logger.warn(`User not found. UserID: ${userId}`);
                throw createHttpError(404, "User not found");
            }

            logger.info(`Email fetched successfully for user. UserID: ${userId}`);
            return email.email;
        } catch (error) {
            logger.error(`Error fetching email for user. UserID: ${userId}`, { error });
            throw new Error("Something went wrong. Please try again.");
        } finally {
            logger.debug("Exiting getEmailByUserId method", { method: "getEmailByUserId", layer: "repository", userId });
        }
    }
}

export default AuthRepository;