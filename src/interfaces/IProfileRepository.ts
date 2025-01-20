export interface IProfileRepository{
    updateExistingUsername(username: string, userID: string): Promise<string>
}