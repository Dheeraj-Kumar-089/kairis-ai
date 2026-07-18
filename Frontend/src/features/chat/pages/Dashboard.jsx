import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../../auth/hooks/useAuth';
import { Plus, Library, Compass, LogOut } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from '../../../components/ui/sidebar';
import ChatListItem from '../components/ChatListItem';
import ChatMessage from '../components/ChatMessage';
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from '../../../components/ui/message-scroller';
import { markLastMessageDoneStreaming } from '../chat.slice';
import { useModeAnimation, ThemeAnimationType } from 'react-theme-switch-animation';
import { Moon, Sun, ArrowUp, X } from 'lucide-react';
import { useSidebar } from '../../../components/ui/sidebar';
import { Skeleton } from '../../../components/ui/skeleton';
import { PanelLeft } from 'lucide-react';

import { Link } from 'react-router';







const Dashboard = () => {



  const chat = useChat();
  const auth = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null); // { file, url }
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'done' | 'error'
  const fileInputRef = useRef(null);
  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isLoading = useSelector((state) => state.chat.isLoading);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    chat.initializeSocketConnection();
    chat.handleGetChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitMessage = (event) => {
    event.preventDefault();
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage) return;
    chat.handleSendMessage({ message: trimmedMessage, chatId: currentChatId });
    setChatInput('');
    removeAttachedImage();
  };

  const handlePickImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (attachedImage) URL.revokeObjectURL(attachedImage.url);
    const isImage = file.type.startsWith('image/');
    setAttachedImage({ file, url: isImage ? URL.createObjectURL(file) : null });
    event.target.value = ''; // allow re-picking the same file

    // Send the file to the backend, which parses it (pdf-parse for PDFs,
    // Gemini vision OCR for images) and stores it in the vector database.
    setUploadStatus('uploading');
    try {
      await chat.handleUploadDocument(file);
      setUploadStatus('done');
    } catch {
      setUploadStatus('error');
    }
  };

  const removeAttachedImage = () => {
    if (attachedImage?.url) URL.revokeObjectURL(attachedImage.url);
    setAttachedImage(null);
    setUploadStatus(null);
  };

  const openChat = (chatId) => chat.handleOpenChat(chatId, chats);

  const handleLogoutClick = async () => {
    await auth.handleLogout();
    navigate('/login', { replace: true });
  };

  const sortedChats = Object.values(chats).sort(
    (a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0)
  );
  const hasStarted = Boolean(currentChatId) && (chats[currentChatId]?.messages?.length || 0) > 0;

  const promptForm = (
    <form
      onSubmit={handleSubmitMessage}
      className="w-full rounded-3xl border border-black/10 dark:border-white/15 bg-[color:var(--bg-surface)] px-4 pb-3 pt-4 transition focus-within:border-brand-400"
    >
      {attachedImage && (
        <div className="relative mb-3 flex w-fit items-center gap-2">
          {attachedImage.url ? (
            <img
              src={attachedImage.url}
              alt="Attached"
              className="h-16 w-16 rounded-xl border border-black/10 object-cover dark:border-white/15"
            />
          ) : (
            <div className="flex h-16 items-center rounded-xl border border-black/10 px-3 text-sm text-[color:var(--text-secondary)] dark:border-white/15">
              {attachedImage.file.name}
            </div>
          )}
          <span className="text-xs text-[color:var(--text-secondary)]">
            {uploadStatus === 'uploading' && 'Processing...'}
            {uploadStatus === 'done' && 'Ready — ask about this file'}
            {uploadStatus === 'error' && 'Upload failed'}
          </span>
          <button
            type="button"
            onClick={removeAttachedImage}
            aria-label="Remove file"
            className="absolute -right-2 -top-2 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black dark:bg-white/70 dark:text-black dark:hover:bg-white"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <input
        type="text"
        value={chatInput}
        onChange={(event) => setChatInput(event.target.value)}
        placeholder="Type your message..."
        className="w-full bg-transparent text-base outline-none placeholder:text-[color:var(--text-secondary)]"
      />

      <div className="mt-3 flex items-center justify-between">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={handlePickImage}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 text-[color:var(--text-secondary)] transition hover:bg-black/10 hover:text-[color:var(--text-primary)] dark:border-white/15 dark:hover:bg-white/10"
        >
          <Plus className="size-4" />
        </button>

        <button
          type="submit"
          disabled={!chatInput.trim() || isLoading}
          aria-label="Send message"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-400 text-zinc-950 transition hover:bg-brand-500 disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </form>
  );


  const { ref, toggleSwitchTheme, isDarkMode } = useModeAnimation({
    animationType: ThemeAnimationType.QR_SCAN,
    duration: 700, // Faster scan animation
  });


  function SidebarFloatingTrigger() {
    const { open, toggleSidebar } = useSidebar();
    if (open) return null;   // only show when collapsed

    return (
      <div className='hidden md:flex justify-center items-center'>
        <div className='flex flex-col gap-5 absolute left-3 top-3 z-50 inline-flex w-10 p-2 items-center justify-center rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] shadow-sm transition hover:bg-black/10 dark:hover:bg-white/10'>
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={toggleSidebar}
            className=""
          >
            <PanelLeft className="h-4.5 w-4.5 cursor-pointer" />
          </button>
          <button
            type="button"
            onClick={toggleSidebar}
            className=""
          >
            <Plus className="h-4 w-4 text-[color:var(--text-secondary)] cursor-pointer" />
          </button>
        </div>



        <div className="absolute left-3 bottom-3 flex items-center gap-2.5 px-1 pb-4 bottom-2 ">

          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt={user?.username || 'Profile'}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 flex items-center justify-center" >{(user?.username).charAt(0).toUpperCase()}
            </div>
          )}

        </div>


      </div>



    );
  }

  return (
    <SidebarProvider>
      <main className="flex h-dvh w-full gap-3 bg-[color:var(--bg-app)] p-2 text-[color:var(--text-primary)] md:gap-4 md:p-4">
        <Sidebar>
          <SidebarHeader>
            {/* Profile */}

            <div className="mb-2 flex items-center gap-2 justify-between mb-7">
              <div className='flex items-center justify-center gap-5'>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-400/15 text-xl font-bold text-brand-500">K</div>

                <Link to='/' className="text-base font-semibold ">Kairis AI</Link>
              </div>
              <div>

                
                <SidebarTrigger className='cursor-pointer'/>

              </div>
            </div>


            {/* Primary nav */}
            <nav className=" flex space-y-0.5">
              <button
                type="button"
                onClick={chat.handleNewChat}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Plus className="h-4 w-4 text-[color:var(--text-secondary)]" />
                New Chat
              </button>



            </nav>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Recent</SidebarGroupLabel>
              <SidebarMenu>
                {sortedChats.length === 0 && (
                  <p className="px-1 text-sm text-[color:var(--text-secondary)]">No chats yet. Start a new one.</p>
                )}
                {sortedChats.map((c) => (
                  <ChatListItem
                    key={c.id}
                    chat={c}
                    active={c.id === currentChatId}
                    onOpen={openChat}
                    onDelete={chat.handleDeleteChat}
                    onRename={chat.handleRenameChat}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2.5 px-1 pb-4">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user?.fullname || 'Profile'}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 flex items-center justify-center" >{(user?.username).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{(user?.fullname).toUpperCase() || 'Guest'}</p>
                <p className="truncate text-xs text-[color:var(--text-secondary)]">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogoutClick}
                aria-label="Log out"
                title="Log out"
                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[color:var(--text-secondary)] transition hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className='relative'>
          <SidebarFloatingTrigger />

          {/* Header row: in normal flow so it never overlaps the chat.
              Mobile: sidebar trigger (opens the drawer) + theme toggle.
              Desktop: just the theme toggle, right-aligned. */}
          <div className="z-10 mb-1 flex shrink-0 items-center justify-between md:justify-end">
            <SidebarTrigger className="cursor-pointer md:hidden" />
            <button
              ref={ref}
              onClick={toggleSwitchTheme}
              aria-label="Toggle theme"
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[color:var(--text-secondary)] transition hover:bg-black/10 hover:text-[color:var(--text-primary)] dark:hover:bg-white/10"
            >
              {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>


          <section className="relative mx-auto flex h-full w-full max-w-3xl min-w-0 flex-1 flex-col gap-4">
            {!hasStarted ? (
              <div className="flex h-full flex-col items-center justify-center gap-5 text-center">

                <h2 className="text-2xl font-semibold">Ask anything</h2>
                <p className="text-sm text-[color:var(--text-secondary)]">
                  Start a conversation below to get answers backed by real sources.
                </p>

                <div className="w-full max-w-2xl">{promptForm}</div>
              </div>
            ) : (
              <>
                <MessageScrollerProvider autoScroll defaultScrollPosition="end">
                  <MessageScroller className="messages flex-1">
                    <MessageScrollerViewport className="no-scrollbar pb-24 md:pb-32 md:pr-1">
                      <MessageScrollerContent>
                        {chats[currentChatId]?.messages.map((message, index) => (
                          <MessageScrollerItem
                            key={index}
                            messageId={`message-${index}`}
                            scrollAnchor={message.role === 'user'}
                          >
                            <ChatMessage
                              message={message}
                              onStreamDone={() => dispatch(markLastMessageDoneStreaming(currentChatId))}
                            />
                          </MessageScrollerItem>
                        ))}
                        {isLoading && (
                          <MessageScrollerItem messageId="typing-indicator">
                            <div className="mr-auto flex w-full max-w-[85%] flex-col gap-3 rounded-2xl px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full bg-brand-400/20" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[85%]" />
                                <Skeleton className="h-4 w-[95%]" />
                                <Skeleton className="h-4 w-[65%]" />
                              </div>
                            </div>
                          </MessageScrollerItem>
                        )}
                      </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                  </MessageScroller>
                </MessageScrollerProvider>

                <div className="mb-2 md:mb-7">{promptForm}</div>
              </>
            )}
          </section>
        </SidebarInset>
      </main>
    </SidebarProvider>
  );
};

export default Dashboard;
