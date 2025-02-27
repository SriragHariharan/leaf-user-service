import createHttpError from "http-errors";
import speakeasy from "speakeasy";
import { signAdminToken } from "../helpers/jwt.helper";
import { IAdminService } from "../interfaces/IAdminService";
import { IAdminRepository } from "../interfaces/IAdminRepository";

class AdminService implements IAdminService {
    private adminRepository: IAdminRepository;
    constructor(adminRepository: IAdminRepository){
        this.adminRepository = adminRepository;
    };
    
    async loginAdmin(email: string, password: string, otp: string): Promise<string | undefined> {
        try {
            const ENV_EMAIL = process.env.ADMIN_EMAIL;
            const ENV_PASSWORD = process.env.ADMIN_PASSWORD;
            const ENV_2FA_SECRET = process.env.ADMIN_2FA_SECRET;

            //validate email and password
            if(email !== ENV_EMAIL || password !== ENV_PASSWORD) {
                throw createHttpError.Unauthorized("Invalid admin credentials");
            }

            //verify 2FA otp generated
            const verified = speakeasy.totp.verify({
                secret: ENV_2FA_SECRET!,
                encoding: 'base32',
                token: otp,
                window: 1
            });

            if(!verified) {
                throw createHttpError.Unauthorized("Invalid OTP");
            }

            //sign jwt token and send to admin
            const token = await signAdminToken();

            return token;

        } catch (error) {
          if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }
};

export default AdminService;