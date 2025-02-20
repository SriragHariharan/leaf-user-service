import { Auth } from "./auth.interface";

export interface IAuthService {
    createNewUser(authDetails: Auth): Promise<string>;
    loginUser(authDetails: Auth): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }>;
    confirmUser(email: string): Promise<boolean>;
    validateOTP(otp: string, userID: string): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }>;
    resendOtp(userID: string): Promise<boolean>;
    resetPassword(userID: string, password: string): Promise<boolean>;
    generateAndStoreOtp(userID: string): Promise<number>;
    ouathSignup(email: string, picture: string, name: string, provider: string): Promise<{ accessToken: string; refreshToken: string; username: string; profilePicture: string | null }>;
    generateNewTokens(userID: string): Promise<{accessToken: string, refreshToken: string}>
}