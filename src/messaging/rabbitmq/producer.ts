import { Auth } from "../../interfaces/auth.interface";
import * as amqp from 'amqplib';

const EXCHANGE = "user_events_exchange";

async function sendUserEvents(userDetails: Auth): Promise<void> {
    let connection;
    try {
        // Create a TCP connection
        connection = await amqp.connect("amqp://myuser:mypassword@localhost");

        // Create a channel (communication line within tcp connection)
        const channel = await connection.createChannel();

        // Create an exchange if not present
        await channel.assertExchange(EXCHANGE, "fanout", { durable: true });

        // Convert userDetails to a buffer
        const bufferMessage = Buffer.from(JSON.stringify(userDetails));

        // Send message to the exchange(No routing key needed for fanout exchange)
        await channel.publish(EXCHANGE, "", bufferMessage);
        console.log("User event sent successfully");

        // Close the channel and connection
        await channel.close();
        await connection.close();
    } catch (error) {
        console.error("Error sending user event:", error);
        if (connection) {
            await connection.close();
        }
        throw error;
    }
}

export default sendUserEvents;