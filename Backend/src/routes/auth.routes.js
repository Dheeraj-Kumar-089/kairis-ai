import {Router} from "express";
import {getMe, login, logout, register, verifyEmail,googleCallback, githubConnect, githubConnectCallback} from "../controllers/auth.controller.js";
import {loginValidator, registerValidator} from "../validators/auth.validator.js";
import { authUser } from "../middlewares/auth.middleware.js";
import passport from "passport";
import { config } from "../config/config.js";

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 * @body {fullname,email,password}
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
    passport.authenticate("google", {
        session: false,

        failureRedirect: `${config.FRONTEND_URL}/login`
    }),
    googleCallback,
)


/**
 * @route GET /api/auth/github/connect
 * @desc Redirect logged-in user to GitHub to authorize repo access (for repo scan/chat)
 * @access Private
 */
authRouter.get("/github/connect", authUser, githubConnect)

/**
 * @route GET /api/auth/github/connect/callback
 * @desc GitHub redirects here after authorization; identity confirmed via signed state param
 * @access Public (state param, not cookie, confirms identity)
 */
authRouter.get("/github/connect/callback", githubConnectCallback)


export default authRouter;
