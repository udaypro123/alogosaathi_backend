import mongoose from "mongoose";
import { DB_NAME } from "../constnts.js";

const connectDB = async()=>{
    try {
       const connectioInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`)
       console.log("✅ Connected to MongoDB")
    } catch (error) {
        console.log("error while connecting DB ")
        process.exit(1)
    }

}

export default connectDB;