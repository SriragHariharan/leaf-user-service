//function to generate a six digit otp
export function generateOtp(): number {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

