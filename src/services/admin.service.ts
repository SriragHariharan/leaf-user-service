import createHttpError from "http-errors";
import speakeasy from "speakeasy";
import { signAdminToken } from "../helpers/jwt.helper";
import { IAdminService } from "../interfaces/IAdminService";
import { IAdminRepository } from "../interfaces/IAdminRepository";
import { Report } from "../interfaces/report.interface";
import { User } from "../interfaces/auth.interface";
import logger from "../helpers/logger";

class AdminService implements IAdminService {
    private adminRepository: IAdminRepository;
    constructor(adminRepository: IAdminRepository) {
        this.adminRepository = adminRepository;
    }

    // Login admin
    async loginAdmin(email: string, password: string, otp: string): Promise<string | undefined> {
        logger.debug(`Entering loginAdmin method. Params: ${email}, ${password}, ${otp}`, { method: "loginAdmin", layer: "service" });
        try {
            const ENV_EMAIL = process.env.ADMIN_EMAIL;
            const ENV_PASSWORD = process.env.ADMIN_PASSWORD;
            const ENV_2FA_SECRET = process.env.ADMIN_2FA_SECRET;

            // Validate email and password
            if (email !== ENV_EMAIL || password !== ENV_PASSWORD) {
                logger.warn("Invalid admin credentials provided", { layer: "service" });
                throw createHttpError.Unauthorized("Invalid admin credentials");
            }

            // Verify 2FA OTP
            const verified = speakeasy.totp.verify({
                secret: ENV_2FA_SECRET!,
                encoding: 'base32',
                token: otp,
                window: 1,
            });

            if (!verified) {
                logger.warn("Invalid OTP provided", { layer: "service" });
                throw createHttpError.BadRequest("Invalid OTP");
            }

            // Sign JWT token and send to admin
            const token = await signAdminToken();
            logger.info("Admin login successful", { layer: "service" });
            return token;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in loginAdmin. Params: ${email}, ${password}, ${otp}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in loginAdmin. Params: ${email}, ${password}, ${otp}`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting loginAdmin method. Params: ${email}, ${password}, ${otp}`, { method: "loginAdmin", layer: "service" });
        }
    }

    // Get the count of users
    async getUsersCount(): Promise<{ total: number; thisMonth: number }> {
        logger.debug(`Entering getUsersCount method`, { method: "getUsersCount", layer: "service" });
        try {
            logger.info("Fetching user counts", { layer: "service" });
            const result = await this.adminRepository.getUsersCount();
            logger.info("Successfully fetched user counts", { layer: "service" });
            return result;
        } catch (error) {
            logger.error("Error fetching user counts", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting getUsersCount method`, { method: "getUsersCount", layer: "service" });
        }
    }

    // Get latest reports
    async getLatestReports(): Promise<Report[]> {
        logger.debug(`Entering getLatestReports method`, { method: "getLatestReports", layer: "service" });
        try {
            logger.info("Fetching latest reports", { layer: "service" });
            const reports = await this.adminRepository.getLatestReports();
            logger.info("Successfully fetched latest reports", { layer: "service" });
            return reports;
        } catch (error) {
            logger.error("Error fetching latest reports", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting getLatestReports method`, { method: "getLatestReports", layer: "service" });
        }
    }

    // Get latest users
    async getLatestUsers(): Promise<User[]> {
        logger.debug(`Entering getLatestUsers method`, { method: "getLatestUsers", layer: "service" });
        try {
            logger.info("Fetching latest users", { layer: "service" });
            const users = await this.adminRepository.getLatestUsers();
            logger.info("Successfully fetched latest users", { layer: "service" });
            return users;
        } catch (error) {
            logger.error("Error fetching latest users", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting getLatestUsers method`, { method: "getLatestUsers", layer: "service" });
        }
    }

    // Search users by name and status
    async searchUsersByNameAndStatus(search: string, status: string): Promise<User[]> {
        logger.debug(`Entering searchUsersByNameAndStatus method. Params: ${search}, ${status}`, { method: "searchUsersByNameAndStatus", layer: "service" });
        try {
            logger.info(`Searching users by name: ${search} and status: ${status}`, { layer: "service" });
            const users = await this.adminRepository.searchUsersByNameAndStatus(search, status);
            logger.info("Successfully fetched users by name and status", { layer: "service" });
            return users;
        } catch (error) {
            logger.error("Error searching users by name and status", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting searchUsersByNameAndStatus method. Params: ${search}, ${status}`, { method: "searchUsersByNameAndStatus", layer: "service" });
        }
    }

    // Block user
    async blockUser(userId: string): Promise<boolean> {
        logger.debug(`Entering blockUser method. Param: ${userId}`, { method: "blockUser", layer: "service" });
        try {
            logger.info(`Blocking user with ID: ${userId}`, { layer: "service" });
            const result = await this.adminRepository.blockUser(userId);
            logger.info("Successfully blocked user", { layer: "service" });
            return result;
        } catch (error) {
            logger.error("Error blocking user", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting blockUser method. Param: ${userId}`, { method: "blockUser", layer: "service" });
        }
    }

    // Unblock user
    async unblockUser(userId: string): Promise<boolean> {
        logger.debug(`Entering unblockUser method. Param: ${userId}`, { method: "unblockUser", layer: "service" });
        try {
            logger.info(`Unblocking user with ID: ${userId}`, { layer: "service" });
            const result = await this.adminRepository.unblockUser(userId);
            logger.info("Successfully unblocked user", { layer: "service" });
            return result;
        } catch (error) {
            logger.error("Error unblocking user", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting unblockUser method. Param: ${userId}`, { method: "unblockUser", layer: "service" });
        }
    }

    // Get profile details
    async getProfileDetails(userID: string): Promise<User> {
        logger.debug(`Entering getProfileDetails method. Param: ${userID}`, { method: "getProfileDetails", layer: "service" });
        try {
            logger.info(`Fetching profile details for userID: ${userID}`, { layer: "service" });
            const user = await this.adminRepository.getProfileDetails(userID);
            logger.info("Successfully fetched profile details", { layer: "service" });
            return user;
        } catch (error) {
            logger.error("Error fetching profile details", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting getProfileDetails method. Param: ${userID}`, { method: "getProfileDetails", layer: "service" });
        }
    }

    // Get reports of a specific user
    async getReportsByUserId(userId: string): Promise<Report[]> {
        logger.debug(`Entering getReportsByUserId method. Param: ${userId}`, { method: "getReportsByUserId", layer: "service" });
        try {
            logger.info(`Fetching reports for userID: ${userId}`, { layer: "service" });
            const reports = await this.adminRepository.getReportsByUserId(userId);
            logger.info("Successfully fetched reports", { layer: "service" });
            return reports;
        } catch (error) {
            logger.error("Error fetching reports", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting getReportsByUserId method. Param: ${userId}`, { method: "getReportsByUserId", layer: "service" });
        }
    }

    // Update report status
    async updateReportStatus(reportId: string, status: string): Promise<boolean> {
        logger.debug(`Entering updateReportStatus method. Params: ${reportId}, ${status}`, { method: "updateReportStatus", layer: "service" });
        try {
            logger.info(`Updating report status for reportID: ${reportId} to ${status}`, { layer: "service" });
            const result = await this.adminRepository.updateReportStatus(reportId, status);
            logger.info("Successfully updated report status", { layer: "service" });
            return result;
        } catch (error) {
            logger.error("Error updating report status", { error, layer: "service" });
            throw error;
        } finally {
            logger.debug(`Exiting updateReportStatus method. Params: ${reportId}, ${status}`, { method: "updateReportStatus", layer: "service" });
        }
    }
}

export default AdminService;