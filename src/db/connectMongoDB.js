import mongoose from 'mongoose';

const connectMongoDB = async () => {
  try {
    const MONGO_UR = process.env.MONGO_URL;
    await mongoose.connect(MONGO_UR);
    console.log('✅ MongoDB connection established successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1); // аварійне завершення програми
  }
};

export { connectMongoDB };
