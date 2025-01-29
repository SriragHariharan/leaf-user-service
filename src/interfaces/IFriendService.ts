/**
 * Interface related to friend requests and handling of friend requests
 */

import { User } from "./auth.interface";

export interface IFriendService{
    searchUser(userID: string, query: string): Promise<User[]>
    sendFriendRequest(userID: string, friendID: string): Promise<boolean>
}