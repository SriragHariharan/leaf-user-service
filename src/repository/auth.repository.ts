import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";
import prisma from "../helpers/prisma.helper";

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
            throw new Error("Failed to create user. Please try again.");
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
            throw new Error("Failed to fetch user. Please try again.");
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
            throw new Error("Failed to save OTP. Please try again.");
        }
    }

    async getOTP(userID: string): Promise<{otp: string, expiresAt: Date, userID: string}> {
        try {
            const result = await prisma.oTP.findUnique({
                where: { userID }
            })
            return {otp: result?.otp!, expiresAt: result?.expiresAt!, userID: userID};
        } catch (error) {
            throw new Error("Failed to validate OTP. Please try again.");
        }
    }
}

export default AuthRepository;