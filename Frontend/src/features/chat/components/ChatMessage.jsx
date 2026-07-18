import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { CodeBlock } from '../../../components/ui/code-block'
import { CopyButton } from '../../../components/ui/copy-button'


function useFastTypewriter(content, streaming, onDone) {
    const [visible, setVisible] = useState(streaming ? '' : content)
    const rafRef = useRef(null)
    const doneRef = useRef(false)

    useEffect(() => {
        if (!streaming) {
            setVisible(content)
            return
        }
        doneRef.current = false
        let i = 0
       
        const charsPerFrame = Math.max(2, Math.ceil(content.length / 120))
        const step = () => {
            i += charsPerFrame
            setVisible(content.slice(0, i))
            if (i < content.length) {
                rafRef.current = requestAnimationFrame(step)
            } else if (!doneRef.current) {
                doneRef.current = true
                onDone?.()
            }
        }
        rafRef.current = requestAnimationFrame(step)
        return () => cancelAnimationFrame(rafRef.current)
    
    }, [content, streaming])

    return visible
}

const ChatMessage = ({ message, onStreamDone }) => {
    const isUser = message.role === 'user'
    const visibleContent = useFastTypewriter(message.content, !!message.streaming, onStreamDone)

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
    const fileUrl = message.fileUrl 
        ? (message.fileUrl.startsWith('http') ? message.fileUrl : `${API_BASE_URL}${message.fileUrl}`)
        : null;

    return (
        <div className={`group flex w-full items-center gap-1.5 animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
            className={`relative max-w-[85%] w-fit rounded-2xl text-sm md:text-base ${isUser
                ? 'rounded-br-none bg-brand-400/15 py-2 pl-3.5 pr-9 text-[color:var(--text-primary)]'
                : 'border-none px-4 py-3 text-[color:var(--text-primary)]'
                }`}
        >
            {isUser && (
                <CopyButton
                    content={message.content}
                    className="absolute right-1.5 top-2.5 h-5 w-5 rounded-md text-[color:var(--text-secondary)] opacity-0 transition group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 hover:text-[color:var(--text-primary)]"
                />
            )}
            {isUser ? (
                <div>
                    {/* Render legacy single fileUrl if present */}
                    {fileUrl && (!message.attachments || !message.attachments.some(a => a.fileUrl === message.fileUrl)) && (
                        <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-black/10 dark:border-white/15">
                            {message.fileType?.startsWith('image/') ? (
                                <img src={fileUrl} alt={message.fileName || "Uploaded Image"} className="max-h-60 w-full object-cover" />
                            ) : (
                                <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-lg">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 text-xs font-bold">PDF</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-[color:var(--text-primary)]">{message.fileName || "document.pdf"}</p>
                                        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-500 hover:underline font-semibold mt-0.5 inline-block">View / Download</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Render new multiple attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2 max-w-full">
                            {message.attachments.map((att, idx) => {
                                const attUrl = att.fileUrl.startsWith('http') ? att.fileUrl : `${API_BASE_URL}${att.fileUrl}`;
                                const isImg = att.fileType?.startsWith('image/');
                                return (
                                    <div key={idx} className="rounded-lg overflow-hidden border border-black/10 dark:border-white/15 max-w-[150px] shrink-0">
                                        {isImg ? (
                                            <img src={attUrl} alt={att.fileName} className="h-24 w-24 object-cover" />
                                        ) : (
                                            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg text-xs h-24 w-32">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-500/10 text-red-500 font-bold text-[10px]">PDF</div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-[10px] text-[color:var(--text-primary)]">{att.fileName}</p>
                                                    <a href={attUrl} target="_blank" rel="noreferrer" className="text-[9px] text-brand-500 hover:underline block mt-1">Download</a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {message.content && !message.content.startsWith('[Attachment:') && message.content !== '[Attachment]' && (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                </div>
            ) : (
                <ReactMarkdown
                    components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
                        code: ({ inline, className, children }) => {
                            const langMatch = /language-(\w+)/.exec(className || '')
                            if (inline || !langMatch) {
                                return <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5">{children}</code>
                            }
                            return (
                                <CodeBlock
                                    code={String(children).replace(/\n$/, '')}
                                    lang={langMatch[1]}
                                    writing={!!message.streaming}
                                />
                            )
                        },
                        pre: ({ children }) => <>{children}</>,
                        h1: ({ children }) => <h1 className="mb-2 mt-3 font-heading text-xl font-semibold first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="mb-2 mt-3 font-heading text-lg font-semibold first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="mb-2 mt-3 font-heading text-base font-semibold first:mt-0">{children}</h3>,
                    }}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {visibleContent}
                </ReactMarkdown>
            )}

            {!isUser && (
                <div className="mt-1 flex justify-start opacity-0 transition group-hover:opacity-100">
                    <CopyButton
                        content={message.content}
                        className="h-5 w-5 text-[color:var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[color:var(--text-primary)]"
                    />
                </div>
            )}
        </div>
        </div>
    )
}

export default ChatMessage
