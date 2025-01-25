import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'info', // Default log level
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json() // Log in JSON format for better log aggregation in production
    ),
    defaultMeta: {"micro-service": 'user-service' },
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple() // Use simple format for console logs
            ),
        }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }), // Log errors
        new transports.File({ filename: 'logs/combined.log' }), // Log all levels
    ],
});


export default logger;
