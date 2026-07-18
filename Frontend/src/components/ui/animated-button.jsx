import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const AnimatedButton = ({
    children = "Get Started",
    className = "",
    as = "button",
    ...rest
}) => {
    const Component = motion[as] || motion.button;

    return (
        <Component
            {...rest}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
            }}
            className={cn(
                "group inline-flex items-center justify-center px-6 py-2.5 rounded-[5px] relative overflow-hidden",
                "bg-brand-400 border border-brand-200/60",
                "text-zinc-950 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:pointer-events-none disabled:opacity-50",
                "[--shine:rgba(255,255,255,.8)]",
                className,
            )}
        >
            <motion.span
                className="tracking-wide font-semibold flex items-center justify-center h-full w-full relative z-10"
                style={{
                    WebkitMaskImage:
                        "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
                    maskImage:
                        "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
                }}
                initial={{ "--mask-x": "100%" }}
                animate={{ "--mask-x": "-100%" }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear", repeatDelay: 1 }}
            >
                {children}
            </motion.span>

            <motion.span
                className="block absolute inset-0 rounded-[5px] p-px"
                style={{
                    background: "linear-gradient(-75deg, transparent 30%, var(--shine) 50%, transparent 70%)",
                    backgroundSize: "200% 100%",
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                }}
                initial={{ backgroundPosition: "100% 0", opacity: 0 }}
                animate={{ backgroundPosition: ["100% 0", "0% 0"], opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            />
        </Component>
    );
};

export default AnimatedButton;
