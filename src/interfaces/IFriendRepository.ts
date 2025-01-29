import { User } from "./auth.interface";

export interface IFriendRepository{
    searchUsersByName(name:string, userID: string): Promise<User[]>
    sendFriendRequest(userID: string, friendID: string): Promise<boolean>
    checkExistingRequest(userID: string, friendID: string)
        : Promise<{ 
            id: number; 
            userID: string; 
            createdAt: Date; 
            friendID: string; 
            status: string 
        } | null>
}