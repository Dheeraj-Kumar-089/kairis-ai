import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { cn } from "../../lib/utils";

export function CopyButton({ content, delay = 2000, className, onCopiedChange, ...props }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(content ?? "");
        } catch {
            // Fallback for browsers/contexts without Clipboard API permission
            const textarea = document.createElement("textarea");
            textarea.value = content ?? "";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        setCopied(true);
        onCopiedChange?.(true, content);
        setTimeout(() => {
            setCopied(false);
            onCopiedChange?.(false, content);
        }, delay);
    }

    return (
        <motion.button
            type="button"
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white",
                className
            )}
            {...props}
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </motion.span>
                ) : (
                    <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                        <Copy className="h-3.5 w-3.5" />
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

export default CopyButton;
