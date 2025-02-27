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
}

export default AdminController;