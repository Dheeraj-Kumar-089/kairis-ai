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
import { markLastMessageDoneStreaming, addNewMessage } from '../chat.slice';
import { useModeAnimation, ThemeAnimationType } from 'react-theme-switch-animation';
import { Moon, Sun, ArrowUp, X, Mic } from 'lucide-react';
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
  const [attachedFiles, setAttachedFiles] = useState([]); // Array of { id, file, url, name, size, type, status, fileUrl }
  const fileInputRef = useRef(null);
  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isLoading = useSelector((state) => state.chat.isLoading);
  const user = useSelector((state) => state.auth.user);
  const [totalUploadedSize, setTotalUploadedSize] = useState(0);

  const [isListening, setIsListening] = useState(false);

  // Setup Browser Speech Recognition API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef(SpeechRecognition ? new SpeechRecognition() : null).current;

  const handleVoiceInput = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please try using Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setChatInput((prev) => (prev ? prev + " " + speechResult : speechResult));
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const messagesCount = currentChatId ? chats[currentChatId]?.messages?.length || 0 : 0;
  const isTooLong = messagesCount >= 30;
  const isCapped = messagesCount >= 35;
  const isUploadingFiles = attachedFiles.some(f => f.status === 'uploading');

  const limitWarning = isTooLong && (
    <div className="mb-3 rounded-lg border border-orange-500/20 bg-orange-500/10 p-3 text-center text-sm font-medium text-orange-500">
        {isCapped 
          ? "Chat limit reached. This chat session is closed. Please start a new chat." 
          : "This chat is becoming too long. Kindly switch to a new chat."
        }
    </div>
  );

  useEffect(() => {
    chat.initializeSocketConnection();
    chat.handleGetChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitMessage = (event) => {
    event.preventDefault();
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage && attachedFiles.length === 0) return;

    // Gather all attachments from successfully uploaded files
    const attachments = attachedFiles
      .filter(f => f.status === 'done')
      .map(f => ({
        fileUrl: f.fileUrl,
        fileName: f.name,
        fileType: f.type
      }));

    chat.handleSendMessage({ 
      message: trimmedMessage, 
      chatId: currentChatId, 
      attachments 
    });

    setChatInput('');
    
    // Clear staging area files
    attachedFiles.forEach(f => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    setAttachedFiles([]);
    setTotalUploadedSize(0);
  };

  const handlePickImage = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if new attachments exceed the max of 5 files total
    if (attachedFiles.length + files.length > 5) {
      alert("You can only upload up to 5 files at one time.");
      event.target.value = '';
      return;
    }

    // 1. Enforce 5MB single file limit and 15MB total limit
    const maxSingleSize = 5 * 1024 * 1024;
    let tempTotalSize = totalUploadedSize;

    for (const f of files) {
      if (f.size > maxSingleSize) {
        alert(`File "${f.name}" exceeds the 5MB single file size limit.`);
        event.target.value = '';
        return;
      }
      tempTotalSize += f.size;
    }

    const maxTotalSize = 15 * 1024 * 1024;
    if (tempTotalSize > maxTotalSize) {
      alert("Total uploaded file size exceeds the 15MB limit.");
      event.target.value = '';
      return;
    }

    // Map files to local state array with uploading status
    const newFiles = files.map((f, idx) => ({
      id: Date.now() + '-' + idx + '-' + Math.random().toString(36).substr(2, 4),
      file: f,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'uploading',
      fileUrl: null
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
    setTotalUploadedSize(tempTotalSize);
    event.target.value = '';

    // Upload each file individually to ImageKit
    newFiles.forEach(async (fItem) => {
      try {
        const response = await chat.handleUploadDocument(fItem.file);
        setAttachedFiles(prev => prev.map(item => 
          item.id === fItem.id 
            ? { ...item, status: 'done', fileUrl: response.fileUrl }
            : item
        ));
      } catch (err) {
        console.error("Failed to upload file:", fItem.name, err);
        setAttachedFiles(prev => prev.map(item => 
          item.id === fItem.id 
            ? { ...item, status: 'error' }
            : item
        ));
      }
    });
  };

  const removeAttachedFile = (fileId) => {
    const fileToRemove = attachedFiles.find(f => f.id === fileId);
    if (!fileToRemove) return;

    if (fileToRemove.url) URL.revokeObjectURL(fileToRemove.url);
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
    setTotalUploadedSize(prev => Math.max(0, prev - fileToRemove.size));
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
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 max-w-[75%] border-b border-black/5 dark:border-white/5 pb-3">
          {attachedFiles.map((fileItem) => {
            const isImg = fileItem.type.startsWith('image/');
            return (
              <div key={fileItem.id} className="relative group/thumb rounded-xl border border-black/10 dark:border-white/15 overflow-hidden w-20 h-20 flex flex-col items-center justify-center bg-black/5 dark:bg-white/5">
                {isImg ? (
                  <img src={fileItem.url} alt={fileItem.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-1 w-full h-full">
                    <div className="text-red-500 font-bold text-xs">PDF</div>
                    <div className="text-[9px] truncate w-full px-1 text-[color:var(--text-secondary)]">{fileItem.name}</div>
                  </div>
                )}
                
                {/* Uploading indicator */}
                {fileItem.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] text-white font-medium">
                    Loading...
                  </div>
                )}
                
                {fileItem.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-[10px] text-white font-medium">
                    Failed
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeAttachedFile(fileItem.id)}
                  aria-label="Remove file"
                  className="absolute top-1 right-1 opacity-100 md:opacity-0 group-hover/thumb:opacity-100 transition inline-flex size-4 items-center justify-center rounded-full bg-black/70 text-white dark:bg-white/70 dark:text-black hover:bg-black dark:hover:bg-white"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        type="text"
        value={chatInput}
        onChange={(event) => setChatInput(event.target.value)}
        disabled={isCapped}
        placeholder={isCapped ? "Chat session closed (limit reached)" : "Type your message..."}
        className="w-full bg-transparent text-base outline-none placeholder:text-[color:var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <div className="mt-3 flex items-center justify-between">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={handlePickImage}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCapped || attachedFiles.length >= 5}
            aria-label="Attach image"
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 text-[color:var(--text-secondary)] transition hover:bg-black/10 hover:text-[color:var(--text-primary)] dark:border-white/15 dark:hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={isCapped}
            aria-label="Voice prompt"
            className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition disabled:pointer-events-none disabled:opacity-50 ${
              isListening
                ? "border-red-500 bg-red-500/20 text-red-500 animate-pulse"
                : "border-black/10 text-[color:var(--text-secondary)] hover:bg-black/10 hover:text-[color:var(--text-primary)] dark:border-white/15 dark:hover:bg-white/10"
            }`}
          >
            <Mic className="size-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={(!chatInput.trim() && attachedFiles.length === 0) || isLoading || isCapped || isUploadingFiles}
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
              alt={user?.fullname || 'Profile'}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 flex items-center justify-center" >{(user?.fullname || 'U').charAt(0).toUpperCase()}
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
                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 flex items-center justify-center" >{(user?.fullname || 'U').charAt(0).toUpperCase()}
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

                {limitWarning}
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
