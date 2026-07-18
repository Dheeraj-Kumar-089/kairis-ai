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
    const [previewImageUrl, setPreviewImageUrl] = useState(null)

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
    const fileUrl = message.fileUrl 
        ? (message.fileUrl.startsWith('http') ? message.fileUrl : `${API_BASE_URL}${message.fileUrl}`)
        : null;
    const attachments = message.attachments || [];
    const hasAttachments = fileUrl || attachments.length > 0;
    console.log("ChatMessage Render:", { message, fileUrl, attachments, hasAttachments });

    return (
        <div className={`group flex w-full flex-col gap-1.5 animate-fade-in-up ${isUser ? 'items-end' : 'items-start'}`}>
            
            {/* Attachments row above the message bubble */}
            {hasAttachments && (
                <div className={`flex flex-wrap gap-2 mb-1 max-w-[75%] ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {/* Legacy Single File support */}
                    {fileUrl && (!message.attachments || !message.attachments.some(a => a.fileUrl === message.fileUrl)) && (
                        <div 
                            onClick={() => message.fileType?.startsWith('image/') && setPreviewImageUrl(fileUrl)}
                            className={`rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 w-20 h-20 shrink-0 bg-black/5 dark:bg-white/5 cursor-pointer ${
                                message.fileType?.startsWith('image/') ? 'hover:scale-105 transition-transform duration-200' : ''
                            }`}
                        >
                            {message.fileType?.startsWith('image/') ? (
                                <img src={fileUrl} alt={message.fileName || "Uploaded Image"} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-1 w-full h-full text-[10px]">
                                    <div className="text-red-500 font-bold">PDF</div>
                                    <div className="truncate w-full px-1 text-[8px] text-[color:var(--text-secondary)]">{message.fileName}</div>
                                    <a href={fileUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[8px] text-brand-500 hover:underline block mt-0.5 font-semibold">Open</a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* New Multiple Attachments */}
                    {attachments.map((att, idx) => {
                        const attUrl = att.fileUrl.startsWith('http') ? att.fileUrl : `${API_BASE_URL}${att.fileUrl}`;
                        const isImg = att.fileType?.startsWith('image/');
                        return (
                            <div 
                                key={idx}
                                onClick={() => isImg && setPreviewImageUrl(attUrl)}
                                className={`rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 w-20 h-20 shrink-0 bg-black/5 dark:bg-white/5 cursor-pointer ${
                                    isImg ? 'hover:scale-105 transition-transform duration-200' : ''
                                }`}
                            >
                                {isImg ? (
                                    <img src={attUrl} alt={att.fileName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-1 w-full h-full text-[10px]">
                                        <div className="text-red-500 font-bold text-xs">PDF</div>
                                        <div className="truncate w-full px-1 text-[8px] text-[color:var(--text-secondary)]">{att.fileName}</div>
                                        <a href={attUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[8px] text-brand-500 hover:underline block mt-0.5 font-semibold">Open</a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Message content bubble */}
            {message.content && !message.content.startsWith('[Attachment:') && message.content !== '[Attachment]' && (
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
                        <p className="whitespace-pre-wrap">{message.content}</p>
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
            )}

            {/* Fullscreen Overlay Preview Lightbox */}
            {previewImageUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="relative max-w-[90%] max-h-[90%] flex items-center justify-center">
                        <img 
                            src={previewImageUrl} 
                            alt="Fullscreen Preview" 
                            className="max-w-full max-h-full rounded-lg object-contain cursor-default shadow-2xl transition-transform duration-200"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

        </div>
    )
}

export default ChatMessage
