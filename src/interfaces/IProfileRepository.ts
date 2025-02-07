export interface IProfileRepository{
    updateExistingUsername(username: string, userID: string): Promise<string>
    updateDescription(description: string, userID: string): Promise<string>
    updateLocation(location: string, userID: string): Promise<string>
    addTravelHistory(location: string, year:string, places: Array<string>, userID: string): Promise<{ id: number; userID: string; destination: string; yearVisited: string; Places: { id: number; travelHistoryID: number; placeName: string }[]; }>
    getTravelHistoryWithPlaces(userID: string): Promise<Object>
    addBucketList(userID: string, destination: string, notes: string): Promise<Object>
    getBucketList(userID: string): Promise<Object>
    updatePicture(userID: string, picture: string, type: string): Promise<boolean>
    getProfileDetails(userID: string): Promise<Object>
    getProfileDetailsWithFriendshipStatus(userID: string, profileID: string): Promise<Object>
    reportUser(
        reporterID: string,  
        reportedID: string, 
        issue: string, 
        description?: string, 
        priority?: string
    ): Promise<{ 
        id: number; 
        reporterID: string; 
        reportedID: string; 
        issue: string; 
        description?: string | undefined; 
        priority: string; 
        createdAt: Date; 
        status: string; 
        updatedAt: Date; 
    }>
}