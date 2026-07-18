import React, { useEffect, useRef, useState } from "react";
import { FileCode2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "../../lib/utils";
import { CopyButton } from "./copy-button";


export function CodeBlock({ code = "", lang = "text", writing = false, speed = 4, className, ...props }) {
    const [visibleChars, setVisibleChars] = useState(writing ? 0 : code.length);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!writing) {
            setVisibleChars(code.length);
            return;
        }
        setVisibleChars(0);
        let i = 0;
        const step = () => {
            i += speed;
            setVisibleChars(Math.min(i, code.length));
            if (i < code.length) {
                rafRef.current = requestAnimationFrame(step);
            }
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [code, writing, speed]);

    const visibleCode = code.slice(0, visibleChars);

    return (
        <div className={cn("my-2 overflow-hidden rounded-lg border border-white/10 bg-[#0d1117]", className)} {...props}>
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
                <div className="flex items-center gap-1.5 font-mono text-xs text-white/50">
                    <FileCode2 className="h-3.5 w-3.5" />
                    <span>{lang}</span>
                </div>
                <CopyButton content={code} />
            </div>
            <div className="relative overflow-x-auto text-sm leading-relaxed">
                <SyntaxHighlighter
                    language={lang}
                    style={oneDark}
                    customStyle={{
                        margin: 0,
                        padding: "0.75rem",
                        background: "transparent",
                        fontFamily: "var(--font-mono)",
                    }}
                    codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
                    wrapLongLines
                >
                    {visibleCode || " "}
                </SyntaxHighlighter>
                {writing && visibleChars < code.length && (
                    <span className="absolute bottom-2 right-3 animate-pulse font-mono text-brand-400">▍</span>
                )}
            </div>
        </div>
    );
}

export default CodeBlock;
