import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";

class AuthRepository implements IAuthRepository{
    
    async create(authDetails: Auth): Promise<boolean> {
        console.log("saving to aws RDS :::", authDetails);
        return true;
        
    }

    async findByEmail(email: string): Promise<Auth> {
        console.log("finding by email on aws RDS")
        return { email }
    }
}

export default AuthRepository;