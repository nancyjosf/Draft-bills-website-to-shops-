require("dotenv").config(); 
const app = require("./app");
const connectDB = require('./config/db'); 

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Please stop the running process or change PORT in .env`,
        );
        process.exit(1);
      }
      console.error("Server error", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();