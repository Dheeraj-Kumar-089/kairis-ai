import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";
import { verificationEmailTemplate, verifiedSuccessPage } from "../services/emailTemplates.js";
import { config } from "../config/config.js";


/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 * @body { fullname, email, password }
 */
export async function register(req, res) {
    const { fullname, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ email }, { fullname }]
    });

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "User with this email or fullname already exists",
            success: false,
            err: "User already exists"
        });
    }

    const user = await userModel.create({ fullname, email, password });


    const emailVerificationToken = jwt.sign({
        email: user.email,
    }, process.env.JWT_SECRET);

    let emailSent = true;

    try {
        await sendEmail({
            to: email,
            subject: `Confirm your Kairis AI account`,
            html: verificationEmailTemplate({
                fullname,
                verifyUrl: `${config.SERVER_URL}/api/auth/verify-email?token=${emailVerificationToken}`,
            }),
        });
    } catch (error) {
       
        emailSent = false;
        console.error("Failed to send verification email:", error.message);
    }

    

    if (emailSent == false) {
        await userModel.deleteOne({ email });
        return res.status(500).json({
            message: "Failed to send verification email",
            success: false,
            err: "Email not sent"
        });
    }else{
        res.status(201).json({
        message:"User registered successfully. Please check your email to verify your account.",
        success: true,
        emailSent,
        user: {
            id: user._id,
            fullname: user.fullname,
            email: user.email
        }
    });
    }

}


/**
 * @desc Login user and return JWT token
 * @route POST /api/auth/login
 * @access Public
 * @body { email, password }
 */

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "User not found"
        });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "Incorrect password"
        });
    }

    if (!user.verified) {
        return res.status(400).json({
            message: "Please verify your email before logging in",
            success: false,
            err: "Email not verified"
        });
    }

    const token = jwt.sign({ id: user._id, fullname: user.fullname }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token);

    res.status(200).json({
        message: "Login successful",
        success: true,
        user: {
            id: user._id,
            fullname: user.fullname,
            email: user.email
        }
    });
}

/**
 * @desc Log out the current user by clearing the auth cookie
 * @route POST /api/auth/logout
 * @access Private
 */
export async function logout(req, res) {
    res.clearCookie("token");

    res.status(200).json({
        message: "Logged out successfully",
        success: true
    });
}

/**
 * @desc Get current logged in user's details
 * @route GET /api/auth/get-me
 * @access Private
 */
export async function getMe(req, res) {
    const userId = req.user.id;

    const user = await userModel.findById(userId).select("-password");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false,
            err: "User not found"
        })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        success: true,
        user
    })
}



export const googleCallback = async (req, res) => {
    const { id, displayName, emails, photos } = req.user
    const email = emails[ 0 ].value;  
    const profilePic = photos[ 0 ].value;


  
    let user = await userModel.findOne({
        email
    })

    if (!user) {
        user = await userModel.create({
            email,
            googleId: id,
            fullname: displayName,
            profilePic
        })
    } else if (!user.googleId) {
        user.googleId = id;
        await user.save();
    }


    const token = jwt.sign({
        id: user._id,
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    })

    user.verified = true
    await user.save()
    res.cookie("token", token)
     

    res.redirect(`${config.FRONTEND_URL}/dashboard`)
}



/**
 * @desc Verify email
 * @route GET /api/auth/verify-email
 * @access Public
 * @query {token}
 */

export async function verifyEmail(req, res) {

    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({
                message: "User not found",
                success: false,
                err: "User not found"
            });
        }

        user.verified = true;
        await user.save();

        const html = verifiedSuccessPage({ loginUrl: `${config.FRONTEND_URL}/login` });

        return res.send(html);

    } catch (err) {
        return res.status(400).json({
            message: "Invalid or expired token",
            success: false,
            err: err.message
        });
    }

}