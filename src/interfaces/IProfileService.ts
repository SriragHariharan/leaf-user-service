import { Size } from "./size.interface";

export interface IProfileService {
    getProfileDetails(userID: string): Promise<Object>;
    updateExistingUsername(username: string, userID: string): Promise<string>;
    updateUserDescription(description: string, userID: string): Promise<string>;
    updateUserLocation(location: string, userID: string): Promise<string>;
    addTravelHistory(
        location: string,
        year: string,
        places: Array<string>,
        userID: string
    ): Promise<{
        id: number;
        userID: string;
        destination: string;
        yearVisited: string;
        Places: { id: number; travelHistoryID: number; placeName: string }[];
    }>;
    getTravelHistory(userID: string): Promise<Object>;
    addBucketListDestination(userID: string, destination: string, notes: string): Promise<Object>;
    getBucketListDestination(userID: string): Promise<Object>;
    uploadPicture(imageBuffer: Buffer, sizes: Size[], type: string, userID: string): Promise<string>;

    getProfileDetailsWithFriendshipStatus(userID: string, profileID: string): Promise<Object>

    reportUser(
        reporterID: string,  //id of the persom reporting the profile
        reportedID: string, //id of the reported profile
        issue: string, 
        description?: string, 
        priority?: string
    ): Promise<{ id: number; reporterID: string; reportedID: string; issue: string; description?: string; priority: string }>
}