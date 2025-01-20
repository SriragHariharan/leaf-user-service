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

    /* update description controller */
    async updateDescription(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req.user?.aud!;
            const { description } = req.body;
            if(!description) throw createHttpError(400, "Description cannot be empty");
            let response = await this.profileService.updateUserDescription(description, userID);
            return res.status(200).json({ success: true, message: "Description updated", data: { response }})
        } catch (error) {
            next(error);
        }
    }

    /* update description controller */
    async updateLocation(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req.user?.aud!;
            const { location } = req.body;
            if(!location) throw createHttpError(400, "Location cannot be empty");
            let response = await this.profileService.updateUserLocation(location, userID);
            return res.status(200).json({ success: true, message: "Location updated", data: { response }})
        } catch (error) {
            next(error);
        }
    }

    /* add travel history */
    async addTravelHistory(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req.user?.aud!;
            const { location, year, places } = req.body;
            if(!location || !year || !places || places.length===0){
                throw createHttpError(400, "All fields are required.");
            }
            let response = await this.profileService.addTravelHistory(location, year, places, userID)
            return res.status(201).json({ success: true, message: "Travel history updated", data: { ...response }})
        } catch (error) {
            next(error);
        }
    }

    async getTravelHistory(req: Request, res: Response, next: NextFunction){
        try {
            let response = await this.profileService.getTravelHistory(req.user?.aud!);
            return res.status(200).json({ success: true, message: "Travel history fetched", data: { ...response }});
        } catch (error) {
            next(error);
        }
    }
}

export default ProfileController