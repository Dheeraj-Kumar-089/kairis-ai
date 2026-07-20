import React from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import { Navigate } from "react-router";
import { GravityStarsBackground } from '@/components/animate-ui/components/backgrounds/gravity-stars';
import AnimatedButton from "../../../components/ui/animated-button";
import KineticTextLoader from "../../../components/ui/kinetic-text-loader";

const Landing = () => {
    const user = useSelector((state) => state.auth.user);
    const loading = useSelector((state) => state.auth.loading);
    const sessionChecked = useSelector((state) => state.auth.sessionChecked);

    if (!sessionChecked || loading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#07090f] text-white">
                <KineticTextLoader text="LOADING" />
            </div>
        );
    }

    return (
        <div className="dark relative min-h-screen w-full overflow-hidden bg-[#07090f] text-white">
            <GravityStarsBackground className="absolute inset-0 flex items-center justify-center rounded-xl" />
            {/* Navbar */}
            <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 pointer-events-none">
                <Link to="/" className="flex items-center gap-2 pointer-events-auto">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 font-bold text-zinc-950">K</div>
                    <span className="text-lg font-semibold tracking-tight">Kairis AI</span>
                </Link>

                <nav className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
                    {user ? (
                        <Link className="flex pointer-events-none items-center gap-2.5 transition hover:opacity-85">
                            {user.profilePic ? (
                                <img
                                    src={user.profilePic}
                                    alt={user.fullname || 'Profile'}
                                    className="h-9 w-9 shrink-0 rounded-full object-cover border border-brand-400/30"
                                />
                            ) : (
                                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 flex items-center justify-center font-bold text-zinc-950 text-xs">
                                    {(user.fullname || user.email || "?").charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="hidden sm:inline text-sm font-medium text-white/80">
                                {user.fullname || 'Dashboard'}
                            </span>
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="rounded-[5px] px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-[5px] bg-brand-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-brand-300"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            {/* Hero */}
            <main className="relative z-10 mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-6 text-center pointer-events-none">
                <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                    Ask anything.<br />
                    <span className="text-brand-400">Get real answers.</span>
                </h1>
                <p className="mt-5 max-w-xl text-balance text-base text-white/60 sm:text-lg">
                    Kairis AI is a premium, context-aware assistant with intelligent multi-model routing, smart RAG document Q&A, and fast voice input.
                </p>

                <div className="mt-9 pointer-events-auto">
                    <Link to={user ? "/dashboard" : "/register"}>
                        <AnimatedButton className="px-8 py-3 text-base cursor-pointer">Get Started</AnimatedButton>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default Landing;
