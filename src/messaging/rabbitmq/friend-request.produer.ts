/* this rabbitmq producer is used to produce a notification to the notification service */
/* when a user sends friend request to another user, the function will be triggered */

import * as amqp from 'amqplib';

const EXCHANGE = "friend_request_exchange";
const ROUTING_KEY = 'friend_request_routing_key';

async function sendFriendRequestNotification(requestSenderID: string, requestReceiverID: string): Promise<void> {
    let connection;
    try {
        // Create a TCP connection
        connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING!);

        // Create a channel (communication line within tcp connection)
        const channel = await connection.createChannel();

        // Create an exchange if not present
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });

        // Convert userDetails to a buffer
        const bufferMessage = Buffer.from(JSON.stringify({ type:"friend_request", requestSenderID, requestReceiverID }));

        // Send message to the exchange(No routing key needed for fanout exchange)
        await channel.publish(EXCHANGE, ROUTING_KEY, bufferMessage);
        console.log("friend request notification sent successfully");

        // Close the channel and connection
        await channel.close();
        await connection.close();
    } catch (error) {
        console.error("Error sending friend request notification: ", error);
        if (connection) {
            await connection.close();
        }
        throw error;
    }
}

export default sendFriendRequestNotification;