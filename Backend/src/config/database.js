import mongoose from "mongoose";


const connectToDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB ");

    try {
        const usersCollection = mongoose.connection.collection('users');
        const indexes = await usersCollection.indexes();
        const hasUsernameIndex = indexes.some(idx => idx.name === 'username_1');
        if (hasUsernameIndex) {
            await usersCollection.dropIndex('username_1');
            console.log("Successfully dropped obsolete 'username_1' index.");
        }
    } catch (err) {
        console.warn("Could not drop username_1 index (it might not exist or connection was not ready):", err.message);
    }
}
export default connectToDB;