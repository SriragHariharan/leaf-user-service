import { Router, Request, Response, NextFunction } from "express";
import AdminRepository from "../repository/admin.repository";
import AdminService from "../services/admin.service";
import AdminController from "../controllers/admin.controller";

//DI
const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

const adminRouter = Router();

//login admin
adminRouter.post("/login", (req: Request, res: Response, next: NextFunction) => {
    adminController.loginAdmin(req, res, next);
});

export default adminRouter;