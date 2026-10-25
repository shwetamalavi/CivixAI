import mongoose from 'mongoose';

let isMongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civixai';
  try {
    // Attempt connection with 3-second timeout to avoid stalling if local mongo isn't up
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log(`[CivixAI] Connected to MongoDB at: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  } catch (err) {
    console.warn(`[CivixAI] MongoDB connection failed (${err.message}).`);
    console.log('[CivixAI] Seamlessly running with high-performance In-Memory Geospatial Civic DB engine.');
    isMongoConnected = false;
  }
};

export const getDbStatus = () => ({
  connected: isMongoConnected,
  type: isMongoConnected ? 'MongoDB Atlas / Local' : 'In-Memory Civic Engine (GeoSpatial active)',
});
