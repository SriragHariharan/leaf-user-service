import * as amqp from 'amqplib';

const EXCHANGE = "otp_exchange";
const ROUTING_KEY = 'otp_routing_key';

async function sendValidationOtp(type: string, email: string, otp: number | string): Promise<void> {
    let connection;
    try {
        // Create a TCP connection
        connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING!);

        // Create a channel (communication line within tcp connection)
        const channel = await connection.createChannel();

        // Create an exchange if not present
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });

        // Convert userDetails to a buffer
        const bufferMessage = Buffer.from(JSON.stringify({ type, email, otp }));

        // Send message to the exchange(No routing key needed for fanout exchange)
        await channel.publish(EXCHANGE, ROUTING_KEY, bufferMessage);
        console.log("OTP sent successfully");

        // Close the channel and connection
        await channel.close();
        await connection.close();
    } catch (error) {
        console.error("Error sending oTP:", error);
        if (connection) {
            await connection.close();
        }
        throw error;
    }
}

export default sendValidationOtp;