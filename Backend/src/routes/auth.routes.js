import {Router} from "express";
import {getMe, login, logout, register, verifyEmail,googleCallback} from "../controllers/auth.controller.js";
import {loginValidator, registerValidator} from "../validators/auth.validator.js";
import { authUser } from "../middlewares/auth.middleware.js";
import passport from "passport";
import { config } from "../config/config.js";

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 * @body {username,email,password}
 * }
 * 
 */

authRouter.post("/register",registerValidator,register)


/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 * @body {email,password}
 * 
 */

authRouter.post("/login",loginValidator,login)


/**
 * @route GET /api/auth/get-me
 * @desc Get current logged in user's details
 * @access Private
 */
authRouter.get('/get-me',authUser, getMe)


/**
 * @route POST /api/auth/logout
 * @desc Log out the current user by clearing the auth cookie
 * @access Private
 */
authRouter.post('/logout', authUser, logout)


/**
 * 
 * @route GET /api/auth/verify-email
 * @desc Verify email
 * @access Public
 * @query {token}
 * 
 */

authRouter.get("/verify-email",verifyEmail)


// /api/auth/google
authRouter.get("/google",
    passport.authenticate("google", { scope: [ "profile", "email" ] }))


    
authRouter.get("/google/callback",
    passport.authenticate("google", {    // this line will send the auth code to google and then finally bring back the user's data from google and store it in req.user
        session: false,
        // FRONTEND_URL is empty in production (same-origin deploy), so this
        // naturally becomes the relative "/login" there and an absolute
        // "http://localhost:5173/login" in dev — no env-specific code needed.
        failureRedirect: `${config.FRONTEND_URL}/login`
    }),
    googleCallback,
)


export default authRouter;
