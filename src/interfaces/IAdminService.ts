export interface IAdminService {
    loginAdmin(email: string, password: string, otp: string): Promise<string | undefined>;
}