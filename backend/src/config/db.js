import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas.
 * Uses the MONGODB_URI from .env (Atlas connection string).
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Atlas connection error:', err.message);
    process.exit(1);
  }
}

export { connectDB };
