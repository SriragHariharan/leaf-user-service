import { Auth } from "./auth.interface";

export interface IAuthRepository{
    create(authDetails: Auth): Promise<boolean>;
    findByEmail(email: string): Promise<Auth>;
}