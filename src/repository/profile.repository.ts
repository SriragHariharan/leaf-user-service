import prisma from "../helpers/prisma.helper";
import { IUsernameRepository } from "../interfaces/IUsernameRepository";

class UsernameRepository implements IUsernameRepository{
    async updateUsername(userID: string, username: string): Promise<string> {
        await prisma.profile.create({
            data: {
                userID,
                username
            },
        });
        return ""

    }
}

export default UsernameRepository;