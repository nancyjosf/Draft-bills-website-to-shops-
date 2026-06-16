const mongoose = require("mongoose");

const dbURI = 'mongodb+srv://nancy_admin:NancyAdmin002@cluster0.7rfru82.mongodb.net/store_db?retryWrites=true&w=majority&appName=Cluster0';

const connectWithUri = async (mongoUri) => {
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected successfully! ✅"); 
};

const connectDB = async () => {
  const mongoUris = [
    process.env.MONGO_URI,
    process.env.MONGODB_URI,
    dbURI,
  ].filter(Boolean);

  let lastError = null;

  for (const mongoUri of mongoUris) {
    try {
      await connectWithUri(mongoUri);
      return;
    } catch (error) {
      lastError = error;
      console.error(`Failed to connect to one of the MongoDB URIs:`, error.message);
    }
  }

  throw lastError || new Error("Unable to connect to MongoDB");
};

module.exports = connectDB;