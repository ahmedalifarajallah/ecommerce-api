const mongoose = require("mongoose");
const config = require("./config");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.uri, {
      dbName: "ecommerce-api",
    });
    logger.info(`DB connection successful! Host: ${conn.connection.host}`);
  } catch (error) {
    logger.error("DB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
