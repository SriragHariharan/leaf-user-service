import createHttpError from "http-errors";
import speakeasy from "speakeasy";
import { signAdminToken } from "../helpers/jwt.helper";
import { IAdminService } from "../interfaces/IAdminService";
import { IAdminRepository } from "../interfaces/IAdminRepository";
import { Report } from "../interfaces/report.interface";
import { User } from "../interfaces/auth.interface";

class AdminService implements IAdminService {
    private adminRepository: IAdminRepository;
    constructor(adminRepository: IAdminRepository){
        this.adminRepository = adminRepository;
    };
    // login admin
    async loginAdmin(email: string, password: string, otp: string): Promise<string | undefined> {
        try {
            const ENV_EMAIL = process.env.ADMIN_EMAIL;
            const ENV_PASSWORD = process.env.ADMIN_PASSWORD;
            const ENV_2FA_SECRET = process.env.ADMIN_2FA_SECRET;

            //validate email and password
            if(email !== ENV_EMAIL || password !== ENV_PASSWORD) {
                throw createHttpError.Unauthorized("Invalid admin credentials");
            }

            //verify 2FA otp generated
            const verified = speakeasy.totp.verify({
                secret: ENV_2FA_SECRET!,
                encoding: 'base32',
                token: otp,
                window: 1
            });

            if(!verified) {
                throw createHttpError.BadRequest("Invalid OTP");
            }

            //sign jwt token and send to admin
            const token = await signAdminToken();

            return token;

        } catch (error) {
          if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    //get the count of users
    async getUsersCount(): Promise<{ total: number; thisMonth: number; }> {
        try {
            return await this.adminRepository.getUsersCount();
        } catch (error) {
            throw error;
        }
    }

    //get latest reports
    async getLatestReports(): Promise<Report[]> {
        try {
            return await this.adminRepository.getLatestReports();
        } catch (error) {
            throw error;
        }    
    }

    //get latest users
    async getLatestUsers(): Promise<User[]> {
        try {
            return await this.adminRepository.getLatestUsers();
        } catch (error) {
            throw error;
        }
    }

    //search users by name and status
    async searchUsersByNameAndStatus(search: string, status: string): Promise<User[]> {
        try {
            return await this.adminRepository.searchUsersByNameAndStatus(search, status);
        } catch (error) {
            throw error;
        }
    }

    //block user
    async blockUser(userId: string): Promise<boolean> {
        try {
            return await this.adminRepository.blockUser(userId);
        } catch (error) {
            throw error;
        }
    }

    //unblock user
    async unblockUser(userId: string): Promise<boolean> {
        try {
            return await this.adminRepository.unblockUser(userId);
        } catch (error) {
            throw error;
        }
    }

    //get profile details
    async getProfileDetails(userID: string): Promise<User> {
        try {
            return await this.adminRepository.getProfileDetails(userID);
        } catch (error) {
            throw error;
        }
    }
};

export default AdminService;