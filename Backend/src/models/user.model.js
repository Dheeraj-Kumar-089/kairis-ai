import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
            minlength: 6,
        },
        profilePic: {
            type: String,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        googleId: {
            type: String,
        },
        messageCountToday: {
            type: Number,
            default: 0,
        },
        lastMessageDate: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

userSchema.pre('save', async function () {   // it is a middleware which runs before saving the user to the database and save the hashed password only
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);   // isme next call nhi hoga apne aap aage badha dega chijo ko
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


const userModel = mongoose.model('User', userSchema);

export default userModel;
