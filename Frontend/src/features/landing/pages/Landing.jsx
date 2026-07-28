import React, { useState } from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import { Navigate } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GravityStarsBackground } from '@/components/animate-ui/components/backgrounds/gravity-stars';
import AnimatedButton from "../../../components/ui/animated-button";
import KineticTextLoader from "../../../components/ui/kinetic-text-loader";
import DEMO_QA from "../demoRepoQA.json";


const DEMO_REPO = "Dheeraj-Kumar-089/kairis-ai";

const RepoDemo = () => {
    const [activeIdx, setActiveIdx] = useState(null);

    return (
        <div className="mt-10 w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-5 text-left pointer-events-auto backdrop-blur">
            <p className="mb-3 text-xs uppercase tracking-wide text-white/40">
                Demo — chatting with the GitHub repo (<span className="text-brand-400">{DEMO_REPO}</span>)
            </p>
            <p className="mb-3 text-[11px] text-white/40">
                This is a quick preview — sign up to chat with any repo live.
            </p>
            <div className="flex flex-wrap gap-2">
                {DEMO_QA.map((qa, idx) => (
                    <button
                        key={qa.question}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                            activeIdx === idx
                                ? "border-brand-400 bg-brand-400/20 text-brand-400"
                                : "border-white/15 text-white/70 hover:bg-white/10"
                        }`}
                    >
                        {qa.question}
                    </button>
                ))}
            </div>
            {activeIdx !== null && (
                <div className="mt-4 max-h-80 overflow-y-auto pr-1 text-left text-sm leading-relaxed text-white/70">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            code: ({ children }) => (
                                <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-brand-400">{children}</code>
                            ),
                            pre: ({ children }) => (
                                <pre className="mb-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs">{children}</pre>
                            ),
                            h1: ({ children }) => <h1 className="mb-2 mt-4 text-xl font-bold text-white first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-bold text-white first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-bold text-white first:mt-0">{children}</h3>,
                        }}
                    >
                        {DEMO_QA[activeIdx].answer}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

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

                <div className="mt-9 flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
                    <Link to={user ? "/dashboard" : "/register"}>
                        <AnimatedButton className="px-8 py-3 text-base cursor-pointer">Get Started</AnimatedButton>
                    </Link>
                    {!user && (
                        <Link
                            to="/dashboard"
                            className="rounded-[5px] border border-white/15 px-6 py-3 text-base font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
                        >
                            Try without signup
                        </Link>
                    )}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                        Chat with any GitHub repo
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                        Docs & image Q&A
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                        Multi-model AI
                    </span>
                </div>

                {!user && <RepoDemo />}
            </main>
        </div>
    );
};

export default Landing;
