import { User } from "./auth.interface";

export interface IFriendRepository{
    searchUsersByName(name:string, userID: string): Promise<User[]>
    sendFriendRequest(userID: string, friendID: string): Promise<boolean>
    checkExistingRequest(userID: string, friendID: string)
        : Promise<{ id: number; userID: string; createdAt: Date; friendID: string; status: string } | null>
    
    getFriendRequests(userID: string): Promise<User[] | null >

    acceptFriendRequest(friendRequestID: number, userID: string)
        : Promise<{ id: number; userID: string; friendID: string; status: string; createdAt: Date; }> 

    rejectFriendRequest(friendRequestID: number, userID: string)
        : Promise<{ id: number; userID: string; friendID: string; status: string; createdAt: Date; }> 
    
    getTotalFriendsCount(userID: string): Promise<number | null>

    getFriendsList(userID: string, page: number): Promise<User[] | null>

    getFriendIDs(userID: string): Promise<string[]>
}