import { createBrowserRouter } from "react-router";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Dashboard from "../features/chat/pages/Dashboard";
import Landing from "../features/landing/pages/Landing";
import Protected from "../features/auth/components/Protected";


export const router = createBrowserRouter([
    {
        path: "/",
        element: <Landing />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/dashboard",
        element: <Protected>
            <Dashboard />
        </Protected>
    }
])
