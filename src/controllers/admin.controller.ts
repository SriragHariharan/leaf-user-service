import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { IAdminService } from '../interfaces/IAdminService';
import logger from '../helpers/logger';

class AdminController {
    private adminService: IAdminService;
    constructor(adminService: IAdminService) {
        this.adminService = adminService;
    }

    /* Login admin */
    async loginAdmin(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering loginAdmin method`, { method: "loginAdmin", layer: "controller" });
        try {
            const { email, password, otp } = req.body;

            // Validate required fields
            if (!email || !password || !otp) {
                logger.warn("Missing required fields in loginAdmin request", { layer: "controller" });
                throw createHttpError(400, "All fields are required");
            }

            // Attempt to log in the admin
            logger.info(`Attempting to log in admin with email: ${email}`, { layer: "controller" });
            const token = await this.adminService.loginAdmin(email, password, otp);

            // Return success response
            logger.info("Admin login successful", { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: { token },
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in loginAdmin`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in loginAdmin`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting loginAdmin method`, { method: "loginAdmin", layer: "controller" });
        }
    }

    /* Get user count */
    async getUsersCount(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getUsersCount method`, { method: "getUsersCount", layer: "controller" });
        try {
            logger.info("Fetching user count", { layer: "controller" });
            const count = await this.adminService.getUsersCount();
            logger.info("Successfully fetched user count", { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "User count fetched successfully",
                data: { count },
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in getUsersCount`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getUsersCount`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getUsersCount method`, { method: "getUsersCount", layer: "controller" });
        }
    }

    /* Get the latest 10 reports */
    async getLatestReports(_req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getLatestReports method`, { method: "getLatestReports", layer: "controller" });
        try {
            logger.info("Fetching latest reports", { layer: "controller" });
            const reports = await this.adminService.getLatestReports();
            logger.info("Successfully fetched latest reports", { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "Latest reports fetched successfully",
                data: { reports },
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in getLatestReports`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getLatestReports`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getLatestReports method`, { method: "getLatestReports", layer: "controller" });
        }
    }

    /* Get users with optional search and status filters */
    async getUsers(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getUsers method`, { method: "getUsers", layer: "controller" });
        try {
            const searchParams = req.query.search?.toString() ?? "";
            const statusParams = req.query.status?.toString() ?? "";

            if (!searchParams && !statusParams) {
                logger.info("Fetching latest users", { layer: "controller" });
                const users = await this.adminService.getLatestUsers();
                logger.info("Successfully fetched latest users", { layer: "controller" });
                return res.status(200).json({
                    success: true,
                    message: "Users fetched successfully",
                    data: { users },
                });
            } else {
                logger.info(`Searching users with search: ${searchParams} and status: ${statusParams}`, { layer: "controller" });
                const users = await this.adminService.searchUsersByNameAndStatus(searchParams, statusParams);
                logger.info("Successfully fetched users by search and status", { layer: "controller" });
                return res.status(200).json({
                    success: true,
                    message: "Users fetched successfully",
                    data: { users },
                });
            }
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in getUsers`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getUsers`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getUsers method`, { method: "getUsers", layer: "controller" });
        }
    }

    /* Block a user */
    async blockUser(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering blockUser method. Param: ${req.params.userID}`, { method: "blockUser", layer: "controller" });
        try {
            const { userID } = req.params;
            logger.info(`Blocking user with ID: ${userID}`, { layer: "controller" });
            await this.adminService.blockUser(userID);
            logger.info("Successfully blocked user", { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "User blocked successfully",
                data: null,
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in blockUser`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in blockUser`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting blockUser method. Param: ${req.params.userID}`, { method: "blockUser", layer: "controller" });
        }
    }

    /* Unblock a user */
    async unblockUser(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering unblockUser method. Param: ${req.params.userID}`, { method: "unblockUser", layer: "controller" });
        try {
            const { userID } = req.params;
            logger.info(`Unblocking user with ID: ${userID}`, { layer: "controller" });
            await this.adminService.unblockUser(userID);
            logger.info("Successfully unblocked user", { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "User unblocked successfully",
                data: null,
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in unblockUser`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in unblockUser`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting unblockUser method. Param: ${req.params.userID}`, { method: "unblockUser", layer: "controller" });
        }
    }

    /* Get profile details */
    async getProfileDetails(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getProfileDetails method. Param: ${req.params.userID}`, { method: "getProfileDetails", layer: "controller" });
        try {
            const { userID } = req.params;
            logger.info(`Fetching profile details for userID: ${userID}`, { layer: "controller" });
            const userDetails = await this.adminService.getProfileDetails(userID);
            if (!userDetails) {
                logger.warn(`User not found for ID: ${userID}`, { layer: "controller" });
                throw createHttpError(404, "User not found");
            }
            logger.info("Successfully fetched profile details", { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "Profile details fetched successfully",
                data: { userDetails },
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in getProfileDetails`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getProfileDetails`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getProfileDetails method. Param: ${req.params.userID}`, { method: "getProfileDetails", layer: "controller" });
        }
    }

    /* Get reports by user ID */
    async getReportsByUserID(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getReportsByUserID method. Param: ${req.params.userID}`, { method: "getReportsByUserID", layer: "controller" });
        try {
            const { userID } = req.params;
            if (!userID) {
                logger.warn("User ID is missing in request", { layer: "controller" });
                throw createHttpError(404, "User not found");
            }
            logger.info(`Fetching reports for userID: ${userID}`, { layer: "controller" });
            const reports = await this.adminService.getReportsByUserId(userID);
            logger.info("Successfully fetched reports", { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "Reports fetched successfully",
                data: { reports },
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in getReportsByUserID`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getReportsByUserID`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getReportsByUserID method. Param: ${req.params.userID}`, { method: "getReportsByUserID", layer: "controller" });
        }
    }

    /* Update the report status */
    async updateReportStatus(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering updateReportStatus method. Params: ${req.params.reportID}, ${req.body.status}`, { method: "updateReportStatus", layer: "controller" });
        try {
            const { reportID } = req.params;
            const { status } = req.body;
            if (status !== "resolved" && status !== "rejected") {
                logger.warn(`Invalid status provided: ${status}`, { layer: "controller" });
                throw createHttpError(400, "Invalid status");
            }
            logger.info(`Updating report status for reportID: ${reportID} to ${status}`, { layer: "controller" });
            await this.adminService.updateReportStatus(reportID, status);
            logger.info("Successfully updated report status", { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "Report status updated successfully",
                data: null,
            });
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in updateReportStatus`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in updateReportStatus`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting updateReportStatus method. Params: ${req.params.reportID}, ${req.body.status}`, { method: "updateReportStatus", layer: "controller" });
        }
    }
}

export default AdminController;