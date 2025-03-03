import { User } from "./auth.interface";
import { Report } from "./report.interface";

export interface IAdminRepository {
    getUsersCount(): Promise<{ total: number; thisMonth: number }>
    getLatestReports(): Promise<Report[]>
    getLatestUsers(): Promise<User[]>
    searchUsersByNameAndStatus(search: string, status: string): Promise<User[]>
    blockUser(userId: string): Promise<boolean>
    unblockUser(userId: string): Promise<boolean>
    getProfileDetails(userID: string): Promise<User>
    getReportsByUserId(userId: string): Promise<Report[]>
    updateReportStatus(reportId: string, status: string): Promise<boolean>
}