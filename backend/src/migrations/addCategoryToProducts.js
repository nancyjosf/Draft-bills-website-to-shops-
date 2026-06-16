const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Product = require("../models/product.model");

const migrateCategoryField = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/store-db";

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    console.log("🔄 Adding category field to all products...");
    const result = await Product.updateMany(
      { category: { $exists: false } },
      { $set: { category: "منظفات" } },
    );

    console.log(`✅ Migration completed!`);
    console.log(`   - Matched products: ${result.matchedCount}`);
    console.log(`   - Modified products: ${result.modifiedCount}`);

    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

migrateCategoryField();
