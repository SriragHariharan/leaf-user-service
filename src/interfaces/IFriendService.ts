/**
 * Interface related to friend requests and handling of friend requests
 */

import { User } from "./auth.interface";

export interface IFriendService{
    searchUser(userID: string, query: string): Promise<User[]>
    sendFriendRequest(userID: string, friendID: string): Promise<boolean>
    getAllFriendRequests(userID: string): Promise<User[] | null>
    acceptFriendRequest(friendRequestID: number, userID: string): Promise<boolean>
    rejectFriendRequest(friendRequestID: number, userID: string): Promise<boolean>
    getTotalFriendsCount(userID: string): Promise<number | null>
    getFriendsList(userID: string, page: number): Promise<User[] | null>
}