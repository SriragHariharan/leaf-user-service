import { Router, Request, Response, NextFunction } from "express";
import AdminRepository from "../repository/admin.repository";
import AdminService from "../services/admin.service";
import AdminController from "../controllers/admin.controller";
import { validateAdminToken } from "../helpers/jwt.helper";

//DI
const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

const adminRouter = Router();

//login admin
adminRouter.post("/login", (req: Request, res: Response, next: NextFunction) => {
    adminController.loginAdmin(req, res, next);
});

//get user count
adminRouter.get("/count", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getUsersCount(req, res, next);
})

//get all profile reports
adminRouter.get("/reports", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getLatestReports(req, res, next);
})

//get all users by search and filter also
adminRouter.get("/users", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getUsers(req, res, next);
})

//block user
adminRouter.put("/block/:userID", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.blockUser(req, res, next);
})

//unblock user
adminRouter.put("/unblock/:userID", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.unblockUser(req, res, next);
})

//get profile details
adminRouter.get("/profile/:userID", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getProfileDetails(req, res, next);
});


export default adminRouter;