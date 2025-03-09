import createHttpError from "http-errors";
import prisma from "../helpers/prisma.helper";
import { IAdminRepository } from "../interfaces/IAdminRepository";
import { Report } from "../interfaces/report.interface";
import logger from "../helpers/logger";

class AdminRepository implements IAdminRepository {

    // Get count of users (total and new users of this month)
    async getUsersCount(): Promise<{ total: number; thisMonth: number }> {
        logger.debug(`Entering getUsersCount method`, { method: "getUsersCount", layer: "repository" });
        try {
            logger.info("Fetching total and monthly user count", { layer: "repository" });
            const totalUsers = await prisma.user.count();

            // Calculate the start of the current month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get the number of users created this month
            const thisMonthUsers = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
            });

            logger.info(`Successfully fetched user counts: total=${totalUsers}, thisMonth=${thisMonthUsers}`, { layer: "repository" });
            return { total: totalUsers, thisMonth: thisMonthUsers };
        } catch (error) {
            logger.error("Error fetching user counts", { error, layer: "repository" });
            throw createHttpError(500, "Something went wrong");
        } finally {
            logger.debug(`Exiting getUsersCount method`, { method: "getUsersCount", layer: "repository" });
        }
    }

    // Get the latest 10 reports
    async getLatestReports(): Promise<Report[]> {
        logger.debug(`Entering getLatestReports method`, { method: "getLatestReports", layer: "repository" });
        try {
            logger.info("Fetching latest reports", { layer: "repository" });
            const reports = await prisma.report.findMany({
                where: {
                    status: 'pending',
                },
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    Reporter: {
                        include: {
                            Profile: true,
                        },
                    },
                    Reported: {
                        include: {
                            Profile: true,
                        },
                    },
                },
            });

            // Format the response to include only necessary profile details
            const formattedReports: Report[] = reports.map((report) => ({
                id: report.id,
                issue: report.issue,
                description: report.description,
                priority: report.priority,
                status: report.status,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
                reporter: {
                    id: report.Reporter.id,
                    email: report.Reporter.email,
                    username: report.Reporter.Profile?.username || null,
                    profilePicture: report.Reporter.Profile?.profilePicture || null,
                },
                reported: {
                    id: report.Reported.id,
                    email: report.Reported.email,
                    username: report.Reported.Profile?.username || null,
                    profilePicture: report.Reported.Profile?.profilePicture || null,
                },
            }));

            logger.info(`Successfully fetched ${reports.length} latest reports`, { layer: "repository" });
            return formattedReports;
        } catch (error) {
            logger.error("Error fetching latest reports", { error, layer: "repository" });
            throw new Error('Failed to fetch pending reports');
        } finally {
            logger.debug(`Exiting getLatestReports method`, { method: "getLatestReports", layer: "repository" });
        }
    }

    // Get latest users
    async getLatestUsers(): Promise<any[]> {
        logger.debug(`Entering getLatestUsers method`, { method: "getLatestUsers", layer: "repository" });
        try {
            logger.info("Fetching latest users", { layer: "repository" });
            const users = await prisma.user.findMany({
                orderBy: {
                    createdAt: 'desc', // Sort by createdAt in descending order (latest first)
                },
                include: {
                    Profile: true, // Include the user's profile
                },
                take: 25,
            });

            // Format the response to include only necessary profile details
            const formattedUsers: any[] = users.map((user) => ({
                id: user.id,
                email: user.email,
                username: user.Profile?.username || null,
                profilePicture: user.Profile?.profilePicture || null,
                createdAt: user.createdAt,
                status: user?.status,
            }));

            logger.info(`Successfully fetched ${users.length} latest users`, { layer: "repository" });
            return formattedUsers;
        } catch (error) {
            logger.error("Error fetching latest users", { error, layer: "repository" });
            throw new Error('Failed to fetch latest users');
        } finally {
            logger.debug(`Exiting getLatestUsers method`, { method: "getLatestUsers", layer: "repository" });
        }
    }

    // Get the searched users by name and status like blocked, active, etc.
    async searchUsersByNameAndStatus(search: string, status: string): Promise<any[]> {
        logger.debug(`Entering searchUsersByNameAndStatus method. Params: ${search}, ${status}`, { method: "searchUsersByNameAndStatus", layer: "repository" });
        try {
            logger.info(`Searching users by name: ${search} and status: ${status}`, { layer: "repository" });
            const users = await prisma.user.findMany({
                where: {
                    Profile: {
                        username: {
                            contains: search,
                        },
                    },
                    status: status,
                },
                include: {
                    Profile: true, // Include the user's profile
                },
            });

            // Format the response to include only necessary profile details
            const formattedUsers: any[] = users.map((user) => ({
                id: user.id,
                email: user.email,
                username: user.Profile?.username || null,
                profilePicture: user.Profile?.profilePicture || null,
                createdAt: user.createdAt,
                status: user?.status,
            }));

            logger.info(`Successfully fetched ${users.length} users matching the search criteria`, { layer: "repository" });
            return formattedUsers;
        } catch (error) {
            logger.error("Error searching users by name and status", { error, layer: "repository" });
            throw new Error('Failed to search users by name');
        } finally {
            logger.debug(`Exiting searchUsersByNameAndStatus method. Params: ${search}, ${status}`, { method: "searchUsersByNameAndStatus", layer: "repository" });
        }
    }

    // Block a user
    async blockUser(userId: string): Promise<boolean> {
        logger.debug(`Entering blockUser method. Param: ${userId}`, { method: "blockUser", layer: "repository" });
        try {
            logger.info(`Blocking user with ID: ${userId}`, { layer: "repository" });
            const user = await prisma.user.update({
                where: { id: userId },
                data: { status: 'blocked' },
            });
            logger.info(`Successfully blocked user with ID: ${userId}`, { layer: "repository" });
            return true;
        } catch (error) {
            logger.error(`Error blocking user with ID: ${userId}`, { error, layer: "repository" });
            throw new Error('Failed to block user');
        } finally {
            logger.debug(`Exiting blockUser method. Param: ${userId}`, { method: "blockUser", layer: "repository" });
        }
    }

    // Unblock a user
    async unblockUser(userId: string): Promise<boolean> {
        logger.debug(`Entering unblockUser method. Param: ${userId}`, { method: "unblockUser", layer: "repository" });
        try {
            logger.info(`Unblocking user with ID: ${userId}`, { layer: "repository" });
            await prisma.user.update({
                where: { id: userId },
                data: { status: 'active' },
            });
            logger.info(`Successfully unblocked user with ID: ${userId}`, { layer: "repository" });
            return true;
        } catch (error) {
            logger.error(`Error unblocking user with ID: ${userId}`, { error, layer: "repository" });
            throw new Error('Failed to unblock user');
        } finally {
            logger.debug(`Exiting unblockUser method. Param: ${userId}`, { method: "unblockUser", layer: "repository" });
        }
    }

    // Get profile details including user info
    async getProfileDetails(userID: string): Promise<any> {
        logger.debug(`Entering getProfileDetails method. Param: ${userID}`, { method: "getProfileDetails", layer: "repository" });
        try {
            logger.info(`Fetching profile details for userID: ${userID}`, { layer: "repository" });
            const user = await prisma.user.findUnique({
                where: { id: userID },
                include: {
                    Profile: true,
                },
            });
            logger.info(`Successfully fetched profile details for userID: ${userID}`, { layer: "repository" });
            return user!;
        } catch (error) {
            logger.error(`Error fetching profile details for userID: ${userID}`, { error, layer: "repository" });
            throw new Error('Failed to get profile details');
        } finally {
            logger.debug(`Exiting getProfileDetails method. Param: ${userID}`, { method: "getProfileDetails", layer: "repository" });
        }
    }

    // Get all reports of a specific user
    async getReportsByUserId(userId: string): Promise<Report[]> {
        logger.debug(`Entering getReportsByUserId method. Param: ${userId}`, { method: "getReportsByUserId", layer: "repository" });
        try {
            logger.info(`Fetching reports for userID: ${userId}`, { layer: "repository" });
            const reports = await prisma.report.findMany({
                where: {
                    Reported: {
                        id: userId,
                    },
                },
                include: {
                    Reporter: {
                        include: {
                            Profile: true,
                        },
                    },
                },
            });
            logger.info(`Successfully fetched ${reports.length} reports for userID: ${userId}`, { layer: "repository" });
            return reports;
        } catch (error) {
            logger.error(`Error fetching reports for userID: ${userId}`, { error, layer: "repository" });
            throw new Error('Failed to fetch reports by user ID');
        } finally {
            logger.debug(`Exiting getReportsByUserId method. Param: ${userId}`, { method: "getReportsByUserId", layer: "repository" });
        }
    }

    // Update the status of the report
    async updateReportStatus(reportId: string, status: string): Promise<boolean> {
        logger.debug(`Entering updateReportStatus method. Params: ${reportId}, ${status}`, { method: "updateReportStatus", layer: "repository" });
        try {
            logger.info(`Updating report status for reportID: ${reportId} to ${status}`, { layer: "repository" });
            await prisma.report.update({
                where: { id: Number(reportId) },
                data: { status: status },
            });
            logger.info(`Successfully updated report status for reportID: ${reportId}`, { layer: "repository" });
            return true;
        } catch (error) {
            logger.error(`Error updating report status for reportID: ${reportId}`, { error, layer: "repository" });
            throw new Error('Failed to update report status');
        } finally {
            logger.debug(`Exiting updateReportStatus method. Params: ${reportId}, ${status}`, { method: "updateReportStatus", layer: "repository" });
        }
    }
}

export default AdminRepository;