require("dotenv").config(); 
const app = require("./app");
const connectDB = require('./config/db'); 

const PORT = process.env.PORT || 5000;

// اتصل بالداتابيز في الخلفية بدون ما تعطّل قيام السيرفر
connectDB().catch(err => console.error("MongoDB connection failed:", err));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
  console.error("Server error", error);
  process.exit(1);
});

module.exports = app;