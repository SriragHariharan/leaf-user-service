import { User } from "./auth.interface";
import { Report } from "./report.interface";

export interface IAdminService {
    loginAdmin(email: string, password: string, otp: string): Promise<string | undefined>;
    getUsersCount(): Promise<{ total: number; thisMonth: number }>
    getLatestReports(): Promise<Report[]>
    getLatestUsers(): Promise<User[]>
    searchUsersByNameAndStatus(search: string, status: string): Promise<User[]>
    blockUser(userId: string): Promise<boolean>
    unblockUser(userId: string): Promise<boolean>
    getProfileDetails(userID: string): Promise<User>
}