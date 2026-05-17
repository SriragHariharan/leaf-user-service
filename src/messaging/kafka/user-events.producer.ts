import { Auth } from "../../interfaces/auth.interface";
import { publish } from "./publish";

const TOPIC = "user.events";

async function sendUserEvents(userDetails: Auth): Promise<void> {
  try {
    await publish(TOPIC, userDetails);
    console.log("User event sent successfully");
  } catch (error) {
    console.error("Error sending user event:", error);
    throw error;
  }
}

export default sendUserEvents;
