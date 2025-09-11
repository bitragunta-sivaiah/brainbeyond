// This file is responsible for establishing a connection to the MongoDB database.

import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()
/**
 * Connects to the MongoDB database using the connection string from environment variables.
 * @returns {Promise<void>} A promise that resolves when the connection is successful.
 */
const connectDB = async () => {
    try {
        // Log a message to indicate that the connection is being attempted.
        console.log('Connecting to MongoDB...');

        const conn = await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        // Log an error message and exit the process if the connection fails.
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
