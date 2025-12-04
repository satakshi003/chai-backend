// require('dotenv').config({path: './env'})

//import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";
import mongoose from "mongoose";

/*dotenv.config({
  path: './env'
})*/


const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectDB(); // ensure DB connected

    console.log(`✅ MONGODB connected !! DB HOST: ${mongoose.connection.host}`);

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    const gracefulShutdown = async () => {
      console.log("Shutting down...");
      await mongoose.connection.close(false);
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (err) {
    console.error("MONGO db connection failed !!!", err);
    process.exit(1);
  }
};

start();


/*connectDB()
.then(() => {
  application.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  })
})
.catch((err) => {
  console.log("MONGO db connection failed !!!", err);
})
*/



/*import express from "express";
const app = express()

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error", () => {
      console.log("ERR:", error);
      throw error
    })
    
app.listen(process.env.PORT, () => {
  console.log(`App is listening on port ${process.env.PORT}`);
})

  } catch (error) {
    console.error("ERROR:", error);
    throw error
  }
})()*/


