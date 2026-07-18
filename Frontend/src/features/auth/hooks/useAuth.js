import { useDispatch } from "react-redux";
import { login, register, getMe, logout } from "../services/auth.api.js";
import { setUser, setLoading, setError, setSessionChecked } from "../auth.slice.js";
import { resetChatState } from "../../chat/chat.slice.js";
import { useEffect } from "react";



export function useAuth() {
    const dispatch = useDispatch();

    async function handleRegister({ email, username, password }) {
        try {
            dispatch(setLoading(true));   
            dispatch(setError(null))
            const data = await register({ email, username, password }); 
            return true;

        } catch (error) {
            console.log(error)
            const errMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || "Registration failed";
            dispatch(setError(errMsg));
            return false;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null)); 
            const data = await login({ email, password });
            dispatch(setUser(data.user));  
            return true;
        } catch (error) {
            const errMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || "Login failed";
            dispatch(setError(errMsg));
            return false;
        } finally {
            dispatch(setLoading(false));
        }
    }


    async function handleGetMe() {
        try {
            dispatch(setLoading(true));
            const data = await getMe();
            dispatch(setUser(data.user));  
        } catch (error) { 

            console.log("Session check: No active session found.");
            dispatch(setUser(null));
        } finally {
            dispatch(setLoading(false));
            dispatch(setSessionChecked(true));
        }
    }


    async function handleLogout() {
        try {
            dispatch(setLoading(true));
            await logout();
            return true;
        } catch (error) {
            console.log(error);
            const errMsg = error.response?.data?.message || "Logout failed";
            dispatch(setError(errMsg));
            return false;
        } finally {
            
            dispatch(setUser(null));
            dispatch(resetChatState());
            dispatch(setLoading(false));
        }
    }


    return {
        handleRegister,
        handleLogin,
        handleGetMe,
        handleLogout,
    }



}