import { NextFunction, Request, Response } from 'express';
import ProfileService from '../services/profile.service';
import createHttpError from 'http-errors';

class ProfileController{
    private profileService: ProfileService
    constructor(profileService: ProfileService){
        this.profileService = profileService
    }

    /* update existing username controller */
    async updateUsername(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req.user?.aud!;
            const { username } = req.body;
            if(!username) throw createHttpError(400, "Username not found");
            let response = await this.profileService.updateExistingUsername(username, userID);
            console.log(response, " username updation response");
            return res.status(200).json({ success: true, message: "Username updated", data: { response }})
        } catch (error) {
            next(error);
        }
    }
}

export default ProfileController