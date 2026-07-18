import axios from 'axios'
import { store } from '../../../app/app.store.js'
import { setUser } from '../auth.slice.js'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
    withCredentials: true,
})

// Automatically log out user if any request returns 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            store.dispatch(setUser(null));
        }
        return Promise.reject(error);
    }
);

export async function register({ email, username, password }) {
    const response = await api.post("/api/auth/register", { email, username, password })
    return response.data
}

export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", { email, password })
    return response.data
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}

export async function logout() {
    const response = await api.post("/api/auth/logout")
    return response.data
}