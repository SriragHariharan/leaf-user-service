import { publish } from "./publish";

const TOPIC = "otp";

async function sendValidationOtp(
  type: string,
  email: string,
  otp: number | string,
): Promise<void> {
  try {
    await publish(TOPIC, { type, email, otp });
    console.log("OTP sent successfully");
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
}

export default sendValidationOtp;
