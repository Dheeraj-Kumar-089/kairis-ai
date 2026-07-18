import React, { useState } from 'react'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from '../../../components/ui/sidebar'

const ChatListItem = ({ chat, active, onOpen, onDelete, onRename }) => {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(chat.title)

    function commitRename() {
        const trimmed = draft.trim()
        setEditing(false)
        if (trimmed && trimmed !== chat.title) {
            onRename(chat.id, trimmed)
        } else {
            setDraft(chat.title)
        }
    }

    return (
        <SidebarMenuItem>
            {editing ? (
                <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') { setDraft(chat.title); setEditing(false) }
                    }}
                    className="w-full rounded-xl border border-brand-400/50 bg-transparent px-3 py-2 text-sm outline-none"
                />
            ) : (
                <SidebarMenuButton active={active} onClick={() => onOpen(chat.id)}>
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate pr-8">{chat.title}</span>
                </SidebarMenuButton>
            )}

            {!editing && (
                <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition group-hover/item:opacity-100">
                    <SidebarMenuAction
                        aria-label={`Rename ${chat.title}`}
                        onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                        className="static translate-y-0"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                    <SidebarMenuAction
                        aria-label={`Delete ${chat.title}`}
                        onClick={(e) => { e.stopPropagation(); onDelete(chat.id) }}
                        className="static translate-y-0 hover:text-red-400"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                </div>
            )}
        </SidebarMenuItem>
    )
}

export default ChatListItem
