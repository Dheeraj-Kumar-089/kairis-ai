import mongoose from "mongoose";


const connectToDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB ")
}
export default connectToDB;