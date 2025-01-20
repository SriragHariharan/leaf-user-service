export interface IProfileRepository{
    updateExistingUsername(username: string, userID: string): Promise<string>
    updateDescription(description: string, userID: string): Promise<string>
    updateLocation(location: string, userID: string): Promise<string>
    addTravelHistory(location: string, year:string, places: Array<string>, userID: string): Promise<{location: string, year:string, places: Array<string>}>
    getTravelHistoryWithPlaces(userID: string): Promise<Object>
}