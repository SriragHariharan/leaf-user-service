export interface IUsernameRepository {
    updateUsername(userID: string, username: string): Promise<string>;
}
