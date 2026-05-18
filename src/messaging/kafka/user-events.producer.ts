import { UserEventPayload } from "./user-event.payload";
import { publish } from "./publish";

const TOPIC = "user.events";

async function sendUserEvents(userDetails: UserEventPayload): Promise<void> {
  try {
    await publish(TOPIC, userDetails);
    console.log("User event sent successfully");
  } catch (error) {
    console.error("Error sending user event:", error);
    throw error;
  }
}

export default sendUserEvents;
