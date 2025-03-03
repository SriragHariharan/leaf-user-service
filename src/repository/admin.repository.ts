import createHttpError from "http-errors";
import prisma from "../helpers/prisma.helper";
import { IAdminRepository } from "../interfaces/IAdminRepository";
import { Report } from "../interfaces/report.interface";
import { User } from "@prisma/client";

class AdminRepository implements IAdminRepository {

    //get count of users(total and new users of this month)
    async getUsersCount(): Promise<{ total: number; thisMonth: number }> {
        try {
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

            return { total: totalUsers, thisMonth: thisMonthUsers };
        } catch (error) {
            throw createHttpError(500, "Something went wrong");
        }
    }

    //get the latest 10 reports
    async getLatestReports(): Promise<Report[]> {
        try {
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

            return formattedReports;
        } catch (error) {
            console.error('Error fetching pending reports:', error);
            throw new Error('Failed to fetch pending reports');
        }
    }


    //get latest users
    async getLatestUsers(): Promise<any[]> {
        try {
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
                status: user?.status
            }));

            return formattedUsers;            
        } catch (error) {
            console.error('Error fetching latest users:', error);
            throw new Error('Failed to fetch latest users');
        }
    }

    //get the searched users by name and status like blocked, active etc
    async searchUsersByNameAndStatus(search: string, status: string): Promise<any[]> {
        try {
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
                status: user?.status
            }));

            return formattedUsers;
        } catch (error) {
            console.error('Error searching users by name:', error);
            throw new Error('Failed to search users by name');
        }
    }

    //block a user
    async blockUser(userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: { status: 'blocked' },
            });
            return true;
        } catch (error) {            
            console.error('Error blocking user:', error);
            throw new Error('Failed to block user');
        }
    }

    //unblock a user
    async unblockUser(userId: string): Promise<boolean> {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { status: 'active' },
            });
            return true;
        } catch (error) {            
            console.error('Error unblocking user:', error);
            throw new Error('Failed to unblock user');
        }
    }

    //get profile details including user info
    async getProfileDetails(userID: string): Promise<User> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userID },
                include: {
                    Profile: true,
                },
            });
            return user!;
        } catch (error) {
            console.error('Error getting profile details:', error);
            throw new Error('Failed to get profile details');
        }
    }

    //get all reports of a specific user
    async getReportsByUserId(userId: string): Promise<Report[]> {
        try {
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
                    }
                },
            });
            return reports;
        } catch (error) {
            console.error('Error fetching reports by user ID:', error);
            throw new Error('Failed to fetch reports by user ID');
        }
    }

    //update the status of the report
    async updateReportStatus(reportId: string, status: string): Promise<boolean> {
        try {
            await prisma.report.update({
                where: { id: Number(reportId) },
                data: { status: status },
            });
            return true;
        } catch (error) {
            console.error('Error updating report status:', error);
            throw new Error('Failed to update report status');
        }
    }

};

export default AdminRepository;