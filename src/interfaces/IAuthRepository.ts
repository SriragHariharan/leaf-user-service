import { Auth } from "./auth.interface";

export interface IAuthRepository{
    create(authDetails: Auth): Promise<Auth>;
    findByEmail(email: string): Promise<Auth | null | undefined>;
    saveOTP({userID, otp, expiresAt}: {userID: string, otp: number, expiresAt: Date}): Promise<number>
    getOTP(userID: string): Promise<{ otp: string, expiresAt: Date, userID: string }>
    resetPassword(userID: string, password: string): Promise<boolean>
    saveOauthUser(email: string, provider: string, name: string, picture: string): Promise<Auth>
    getBasicProfile(userID: string): Promise<{username: string, profilePicture: string | null}>
}