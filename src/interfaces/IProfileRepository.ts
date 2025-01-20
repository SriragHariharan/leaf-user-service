export interface IProfileRepository{
    updateExistingUsername(username: string, userID: string): Promise<string>
    updateDescription(description: string, userID: string): Promise<string>
    updateLocation(localtion: string, userID: string): Promise<string>
}