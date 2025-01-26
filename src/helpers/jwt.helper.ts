import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import redisHelper from './redis.helper';

//re open the Request interface and add user object to it;
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export function signAccessToken(userID: string): string {
    const payload = {}
    const secret = process.env.ACCESS_TOKEN_SECRET!;
    const options = {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
        issuer: 'leaf.com',
        audience: userID,
    };
    return jwt.sign(payload, secret, options)
}

export function signRefreshToken(userID: string): string {
    const payload = {}
    const secret = process.env.REFRESH_TOKEN_SECRET!;
    const options = {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
        issuer: 'leaf.com',
        audience: userID,
    };
    return jwt.sign(payload, secret, options)
}

export function validateAccessToken(req: Request, _res: Response, next: NextFunction): void {
    try {
        console.log(req.headers, "token comming from client");
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return next(createHttpError.Unauthorized("Unauthorized request, authorization header is required." + req.headers['authorization']));
        }
    
        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        if (!token) {
            return next(createHttpError.Unauthorized("Unauthorized request, token is required."));
        }
        const resp = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)
        req.user = resp;
        next(); 
    } catch (error) {
        console.log("axt validation error ::: ", error)
        return next(createHttpError.Unauthorized("Unauthorized request" + error));
    }
}

export async function validateRefreshToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const refreshToken = req.body?.refreshToken;
        if (!refreshToken) {
            return next(createHttpError.Unauthorized("Unauthorized request"));
        }
        const resp = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!)
        req.user = resp;
        //match the refresh token from user and refresh token from redis
        const refreshTokenFromRedis = await redisHelper.get(`RefreshToken:${req.user?.aud!}`);
        console.log("refresh token from redis ::: " + refreshTokenFromRedis);
        if(refreshTokenFromRedis !== refreshToken) {
            return next(createHttpError.Unauthorized("Unauthorized request"));
        }
        next(); 
    } catch (error) {
        console.log("Refresh token validation error ::: ", error)
        return next(createHttpError.Unauthorized("Unauthorized request" + error));
    }
}