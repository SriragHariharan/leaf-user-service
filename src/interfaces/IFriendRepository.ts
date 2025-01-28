import { User } from "./auth.interface";

export interface IFriendRepository{
    searchUsersByName(name:string, userID: string): Promise<User[]>
}