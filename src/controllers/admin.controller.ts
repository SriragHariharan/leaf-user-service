import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import AdminService  from '../services/admin.service'; // Adjust the import path
import { IAdminService } from '../interfaces/IAdminService';

class AdminController {
    private adminService: IAdminService;
    constructor(adminService: IAdminService) {
        this.adminService = adminService;
    }

    async loginAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, otp } = req.body;

            // Validate required fields
            if (!email || !password || !otp) {
                throw createHttpError(400, "All fields are required");
            }

            // Attempt to log in the admin
            const token = await this.adminService.loginAdmin(email, password, otp);

            // Return success response
            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: { token },
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    //get user count
    async getUsersCount(req: Request, res: Response, next: NextFunction) {
        try {
            const count = await this.adminService.getUsersCount();
            return res.status(200).json({
                success: true,
                message: "User count fetched successfully",
                data: { count },
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    //get the latest 10 reports
    async getLatestReports(_req: Request, res: Response, next: NextFunction) {
        try {
            const reports = await this.adminService.getLatestReports();
            return res.status(200).json({
                success: true,
                message: "Latest reports fetched successfully",
                data: { reports },
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {   
            const searchParams = req.query.search;
            const statusParams = req.query.status
            if(!searchParams && !statusParams){
                const users = await this.adminService.getLatestUsers();
                return res.status(200).json({
                    success: true,
                    message: "Users fetched successfully",
                    data: { users },
                });
            }else{
                const users = await this.adminService.searchUsersByNameAndStatus(searchParams, statusParams);
                return res.status(200).json({
                    success: true,
                    message: "Users fetched successfully",
                    data: { users },
                });
            }
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred")); 
            }
        }
    }

    //block user
    async blockUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { userID } = req.params;
            await this.adminService.blockUser(userID);
            return res.status(200).json({
                success: true,
                message: "User blocked successfully",
                data: null
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    //unblock user
    async unblockUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { userID } = req.params;
            await this.adminService.unblockUser(userID);
            return res.status(200).json({
                success: true,
                message: "User unblocked successfully",
                data: null
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    //get profile details
    async getProfileDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { userID } = req.params;
            const userDetails = await this.adminService.getProfileDetails(userID);
            if(!userDetails){
                throw createHttpError(404, "User not found");
            }
            return res.status(200).json({
                success: true,
                message: "Profile details fetched successfully",
                data: { userDetails }
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    async getReportsByUserID(req: Request, res: Response, next: NextFunction) {
        try {
            const { userID } = req.params;
            if(!userID){
                throw createHttpError(404, "User not found");
            }
            const reports = await this.adminService.getReportsByUserId(userID);
            return res.status(200).json({
                success: true,
                message: "Reports fetched successfully",
                data: { reports }
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    //update the report status
    async updateReportStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { reportID } = req.params;
            const { status } = req.body;
            if(status !== "resolved" && status !== "rejected"){
                throw createHttpError(400, "Invalid status");
            }
            await this.adminService.updateReportStatus(reportID, status);
            return res.status(200).json({
                success: true,
                message: "Report status updated successfully",
                data: null
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                next(error);
            } else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }
}

export default AdminController;