import { Auth } from "../interfaces/auth.interface";
import { IAuthRepository } from "../interfaces/IAuthRepository";


class UserService{

    private authRepository: IAuthRepository;

     constructor(authRepository: IAuthRepository) {
        this.authRepository = authRepository;
    }

    async createNewUser(authDetails: Auth): Promise<boolean>{
        console.log(authDetails, "  to repo")
        const user = await this.authRepository.create(authDetails);
        console.log("from repo", user);
        return true;
    }
};

export default UserService;
//find user in db or not

//if user present, reject saying user present

//if user not present, hash the password & save to db

//send otp to the email

//send a boolean value of true back