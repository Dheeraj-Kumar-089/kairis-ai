import mongoose from 'mongoose';


const guestUsageSchema = new mongoose.Schema(
    {
        fingerprint: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        guestIds: {
            type: [String],
            default: [],
        },
        messageCount: {
            type: Number,
            default: 0,
        },
        photoUsedChats: {
            type: [String],
            default: [],
        },
        repoUsed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const guestUsageModel = mongoose.model('GuestUsage', guestUsageSchema);

export default guestUsageModel;
