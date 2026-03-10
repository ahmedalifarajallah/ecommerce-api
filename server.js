const connectDB = require("./config/db");
const config = require("./config/config");
const logger = require("./utils/logger");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    logger.error(err.message, err);
    process.exit(1);
});

const app = require("./app");

// Connect to Database
connectDB();

// Start Server
const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.env} mode`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    logger.error(err.message, err);

    server.close(() => {
        process.exit(1);
    });
});
