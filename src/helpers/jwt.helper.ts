import jwt from 'jsonwebtoken';

export function signAccessToken(userID: string): string {
    const payload = {}
    const secret = process.env.ACCESS_TOKEN_SECRET!;
    const options = {
        expiresIn: '1h',
        issuer: 'leaf.com',
        audience: userID,
    };
    return jwt.sign(payload, secret, options)
}

export function signRefreshToken(userID: string): string {
    const payload = {}
    const secret = process.env.REFRESH_TOKEN_SECRET!;
    const options = {
        expiresIn: '7D',
        issuer: 'leaf.com',
        audience: userID,
    };
    return jwt.sign(payload, secret, options)
}