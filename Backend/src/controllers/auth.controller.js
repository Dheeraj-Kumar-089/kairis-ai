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

    res.cookie("token", token, {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: config.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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
    res.clearCookie("token", {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: config.NODE_ENV === "production" ? "none" : "lax"
    });

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
    res.cookie("token", token, {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: config.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
     

    res.redirect(`${config.FRONTEND_URL}/dashboard`)
}



/**
 * @desc Redirect the logged-in user to GitHub to authorize repo access
 * @route GET /api/auth/github/connect
 * @access Private
 */
export function githubConnect(req, res) {
    if (!config.GITHUB_OAUTH_CLIENT_ID) {
        return res.status(500).json({ message: "GitHub OAuth is not configured on this server" });
    }

    // Sign the user id into `state` so the callback can identify them even
    // though GitHub's redirect is a fresh top-level navigation (cookie still
    // rides along since it's the same domain, but state gives us a second,
    // tamper-proof way to confirm identity).
    const state = jwt.sign({ id: req.user.id }, config.JWT_SECRET, { expiresIn: "10m" });

    const params = new URLSearchParams({
        client_id: config.GITHUB_OAUTH_CLIENT_ID,
        redirect_uri: config.GITHUB_OAUTH_CALLBACK_URL,
        scope: "repo",
        state,
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

/**
 * @desc Handle GitHub's OAuth redirect back, exchange code for a token, save it
 * @route GET /api/auth/github/connect/callback
 * @access Private (identity confirmed via signed `state`, not cookie, since
 *         GitHub's redirect can arrive as a fresh navigation)
 */
export async function githubConnectCallback(req, res) {
    const { code, state } = req.query;

    try {
        const decoded = jwt.verify(state, config.JWT_SECRET);
        const userId = decoded.id;

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                client_id: config.GITHUB_OAUTH_CLIENT_ID,
                client_secret: config.GITHUB_OAUTH_CLIENT_SECRET,
                code,
                redirect_uri: config.GITHUB_OAUTH_CALLBACK_URL,
            }),
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            console.error("GitHub OAuth token exchange failed:", tokenData);
            return res.redirect(`${config.FRONTEND_URL}/dashboard?github=error`);
        }

        const profileRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                "User-Agent": "kairis-ai",
            },
        });
        const profile = await profileRes.json();

        await userModel.findByIdAndUpdate(userId, {
            githubAccessToken: tokenData.access_token,
            githubUsername: profile.login,
        });

        return res.redirect(`${config.FRONTEND_URL}/dashboard?github=connected`);
    } catch (err) {
        console.error("GitHub connect callback failed:", err.message);
        return res.redirect(`${config.FRONTEND_URL}/dashboard?github=error`);
    }
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
            return res.redirect(`${config.FRONTEND_URL}/login?error=user_not_found`);
        }

        user.verified = true;
        await user.save();

        return res.redirect(`${config.FRONTEND_URL}/login?verified=true`);

    } catch (err) {
        return res.redirect(`${config.FRONTEND_URL}/login?error=invalid_token`);
    }

}