import mongoose from 'mongoose';
import dotenv from 'dotenv';

// database connection
const connectDB = async () => {
    try {
        // console.log("DB_URI", process.env.DB_URL);
        await mongoose.connect(process.env.DB_URL);
        console.log('MongoDB Connected…');
    } catch (err) {
        console.error("Error connecting to the database:", err.message);
        throw err; // Re-throw to handle in index.js
    }
}

export default connectDB;