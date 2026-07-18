import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeft } from "lucide-react";
import { cn } from "../../lib/utils";

const SidebarContext = createContext(null);

export function SidebarProvider({ children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    const [openMobile, setOpenMobile] = useState(false);

    const toggleSidebar = () => {
        setOpen((o) => !o);
        setOpenMobile((o) => !o);
    };

    return (
        <SidebarContext.Provider value={{ open, setOpen, openMobile, setOpenMobile, toggleSidebar }}>
            <div className="flex h-full w-full">{children}</div>
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
    return ctx;
}

export function Sidebar({ children, className, ...props }) {
    const { open, openMobile, setOpenMobile } = useSidebar();

    return (
        <>
            {/* Desktop / tablet */}
            <motion.aside
                initial={false}
                animate={{ width: open ? 288 : 0, opacity: open ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "hidden md:flex h-full shrink-0 flex-col overflow-hidden rounded-[10px] border",
                    "bg-[color:var(--bg-surface)] border-[color:var(--border-subtle)]",
                    className
                )}
                {...props}
            >
                <div className="flex h-full w-72 flex-col p-4">{children}</div>
            </motion.aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {openMobile && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/50 md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpenMobile(false)}
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col rounded-r-3xl border-r p-4 md:hidden bg-[color:var(--bg-surface)] border-[color:var(--border-subtle)]"
                        >
                            {children}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export function SidebarHeader({ children, className, ...props }) {
    return <div className={cn("mb-4 shrink-0", className)} {...props}>{children}</div>;
}

export function SidebarContent({ children, className, ...props }) {
    return <div className={cn("sidebar-scroll flex-1 space-y-4 overflow-y-auto", className)} {...props}>{children}</div>;
}

export function SidebarFooter({ children, className, ...props }) {
    return <div className={cn("mt-4 shrink-0 border-t pt-4 border-[color:var(--border-subtle)]", className)} {...props}>{children}</div>;
}

export function SidebarGroup({ children, className, ...props }) {
    return <div className={cn("space-y-1", className)} {...props}>{children}</div>;
}

export function SidebarGroupLabel({ children, className, ...props }) {
    return <p className={cn("px-1 pb-1 text-xs font-medium uppercase tracking-wide text-[color:var(--text-secondary)]", className)} {...props}>{children}</p>;
}

export function SidebarMenu({ children, className, ...props }) {
    return <div className={cn("space-y-1", className)} {...props}>{children}</div>;
}

export function SidebarMenuItem({ children, className, ...props }) {
    return <div className={cn("group/item relative", className)} {...props}>{children}</div>;
}

export function SidebarMenuButton({ children, active, className, ...props }) {
    return (
        <button
            type="button"
            className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition truncate",
                active
                    ? "bg-black/[0.06] dark:bg-white/10 text-[color:var(--text-primary)]"
                    : "text-[color:var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[color:var(--text-primary)]",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function SidebarMenuAction({ children, className, ...props }) {
    return (
        <button
            type="button"
            className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[color:var(--text-secondary)] opacity-0 transition hover:bg-black/10 dark:hover:bg-white/10 group-hover/item:opacity-100",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function SidebarTrigger({ className, ...props }) {
    const { toggleSidebar } = useSidebar();
    return (
        <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
            className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--text-secondary)] transition hover:bg-black/10 dark:hover:bg-white/10",
                className
            )}
            {...props}
        >
            <PanelLeft className="h-4.5 w-4.5" />
        </button>
    );
}

export function SidebarInset({ children, className, ...props }) {
    return <div className={cn("flex h-full min-w-0 flex-1 flex-col", className)} {...props}>{children}</div>;
}



