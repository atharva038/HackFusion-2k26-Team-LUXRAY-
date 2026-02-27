import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Send, Loader2, Plus, Trash2, MessageSquare,
    ChevronRight, Zap, Package, BarChart3, ShieldCheck, X, AlertCircle
} from 'lucide-react';
import {
    streamPharmacistAgentMessage,
    fetchPharmacistAgentSessions,
    fetchPharmacistAgentHistory,
    deletePharmacistAgentSession,
} from '../../services/api';
import { parseStructuredOutput } from '../../utils/parseStructuredOutput';
import StructuredRenderer from '../../components/chat/StructuredRenderer';
import MarkdownText from '../../components/chat/MarkdownText';

// ─── Quick command suggestions ────────────────────────────────────────────────
const QUICK_COMMANDS = [
    { label: 'Pending Orders', prompt: 'Show me all pending orders', icon: Package },
    { label: 'Inventory Analysis', prompt: 'Analyze current inventory and suggest what to restock', icon: BarChart3 },
    { label: 'Low Stock Alert', prompt: 'Which medicines are running low on stock?', icon: AlertCircle },
    { label: 'Verify Prescriptions', prompt: 'How many prescriptions are awaiting approval?', icon: ShieldCheck },
];

// ─── Message bubble ───────────────────────────────────────────────────────────
const AgentMessageBubble = ({ message }) => {
    const isAi = message.role === 'ai';
    // Structured-only priority: hide text bubble when structured data is ready
    const hasStructured = isAi && !!message.structured && !message.isStreaming;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`flex flex-col w-full ${isAi ? 'items-start' : 'items-end'}`}
        >
            {/* ── Show text bubble only when NOT displaying structured output ── */}
            {!hasStructured && (
                <div className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'}`}>
                    {isAi && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                    )}
                    <div className={`max-w-[78%] px-4 py-3 text-[14.5px] leading-relaxed rounded-2xl
                        ${isAi
                            ? 'bg-card text-text border border-black/5 dark:border-white/5 shadow-sm rounded-tl-sm'
                            : 'bg-primary text-white font-medium rounded-tr-sm shadow-sm whitespace-pre-wrap'
                        }`}
                    >
                        {message.isStreaming ? (
                            <>
                                {message.text}
                                <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                            </>
                        ) : isAi ? (
                            <MarkdownText text={message.text} />
                        ) : (
                            message.text
                        )}
                    </div>
                </div>
            )}

            {/* ── Structured output: renders instead of the text bubble for lists/summaries */}
            {hasStructured && (
                <div className="flex w-full justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <StructuredRenderer structured={message.structured} />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        className="flex justify-start"
    >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
            <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="bg-card border border-black/5 dark:border-white/5 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex gap-1.5 items-center h-5">
                {[0, 150, 300].map((delay) => (
                    <span
                        key={delay}
                        className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                    />
                ))}
            </div>
        </div>
    </motion.div>
);

// ─── Session item ─────────────────────────────────────────────────────────────
const SessionItem = ({ session, isActive, onClick, onDelete }) => (
    <div
        onClick={onClick}
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm
            ${isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text'
            }`}
    >
        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
        <span className="flex-1 truncate">{session.title}</span>
        <button
            onClick={(e) => { e.stopPropagation(); onDelete(session._id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0"
        >
            <Trash2 className="w-3 h-3" />
        </button>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const PharmacistAgent = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [streamController, setStreamController] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const abortRef = useRef(null);

    // ── Scroll to bottom on new message ────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Load sessions on mount ──────────────────────────────────────────────
    useEffect(() => {
        fetchPharmacistAgentSessions()
            .then(({ sessions }) => setSessions(sessions || []))
            .catch(() => setSessions([]));
    }, []);

    // ── Load a session's history ────────────────────────────────────────────
    const loadSession = useCallback(async (sid) => {
        if (sid === sessionId) return;
        setLoadingHistory(true);
        setMessages([]);
        setSessionId(sid);

        try {
            const { history } = await fetchPharmacistAgentHistory(sid);
            const loaded = (history || []).map((m, i) => ({
                id: i,
                role: m.role,
                text: m.content,
            }));
            setMessages(loaded);
        } catch {
            setMessages([{ id: 0, role: 'ai', text: 'Failed to load conversation history.' }]);
        } finally {
            setLoadingHistory(false);
        }
    }, [sessionId]);

    // ── Delete a session ────────────────────────────────────────────────────
    const handleDeleteSession = useCallback(async (sid) => {
        try {
            await deletePharmacistAgentSession(sid);
            setSessions(prev => prev.filter(s => s._id !== sid));
            if (sid === sessionId) {
                setSessionId(null);
                setMessages([]);
            }
        } catch {
            // Silently fail — user can retry
        }
    }, [sessionId]);

    // ── Start a new session ─────────────────────────────────────────────────
    const startNewSession = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        setSessionId(null);
        setMessages([]);
        setInput('');
        inputRef.current?.focus();
    }, []);

    // ── Send message (streaming) ─────────────────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        const userText = (text || input).trim();
        if (!userText || isLoading) return;

        setInput('');
        setIsLoading(true);

        // Add user message
        const userMsg = { id: Date.now(), role: 'user', text: userText };
        setMessages(prev => [...prev, userMsg]);

        // Add placeholder AI message for streaming
        const aiMsgId = Date.now() + 1;
        setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', isStreaming: true }]);

        let finalSessionId = sessionId;

        const controller = streamPharmacistAgentMessage(
            userText,
            sessionId,
            {
                onChunk: (chunk) => {
                    setMessages(prev => prev.map(m =>
                        m.id === aiMsgId ? { ...m, text: m.text + chunk } : m
                    ));
                },
                onDone: (blocked, newSessionId, finalText) => {
                    finalSessionId = newSessionId || finalSessionId;
                    const resolvedText = finalText || '';
                    const structured = parseStructuredOutput(resolvedText);

                    setMessages(prev => prev.map(m =>
                        m.id === aiMsgId
                            ? { ...m, isStreaming: false, text: resolvedText || m.text, structured }
                            : m
                    ));

                    // Update session ID and refresh session list
                    if (newSessionId && newSessionId !== sessionId) {
                        setSessionId(newSessionId);
                        fetchPharmacistAgentSessions()
                            .then(({ sessions }) => setSessions(sessions || []))
                            .catch(() => { });
                    }

                    setIsLoading(false);
                    setTimeout(() => inputRef.current?.focus(), 100);
                },
                onError: (errMsg) => {
                    setMessages(prev => prev.map(m =>
                        m.id === aiMsgId
                            ? { ...m, isStreaming: false, text: errMsg || 'Something went wrong. Please try again.' }
                            : m
                    ));
                    setIsLoading(false);
                },
            }
        );

        abortRef.current = controller;
    }, [input, isLoading, sessionId]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const isEmptyState = messages.length === 0 && !loadingHistory;

    return (
        <div className="flex h-[calc(100vh-9rem)] gap-0 overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-card">

            {/* ── Left: Session sidebar ─────────────────────────────────────── */}
            <aside className="w-56 shrink-0 border-r border-black/5 dark:border-white/5 flex flex-col bg-bg/50">
                <div className="p-3 border-b border-black/5 dark:border-white/5">
                    <button
                        onClick={startNewSession}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-hide">
                    {sessions.length === 0 ? (
                        <p className="text-xs text-text-muted text-center mt-6 px-2">
                            No conversations yet. Ask the AI assistant anything.
                        </p>
                    ) : (
                        sessions.map(s => (
                            <SessionItem
                                key={s._id}
                                session={s}
                                isActive={s._id === sessionId}
                                onClick={() => loadSession(s._id)}
                                onDelete={handleDeleteSession}
                            />
                        ))
                    )}
                </div>
            </aside>

            {/* ── Right: Chat area ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <div className="h-14 px-5 border-b border-black/5 dark:border-white/5 flex items-center gap-3 shrink-0 bg-card">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-[14px] font-semibold text-text leading-tight">Pharmacy AI Assistant</h2>
                        <p className="text-[11px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                            Ready · Stock · Orders · Analytics
                        </p>
                    </div>
                    {sessionId && (
                        <button
                            onClick={startNewSession}
                            title="New conversation"
                            className="ml-auto p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
                    {loadingHistory ? (
                        <div className="flex items-center justify-center h-full text-text-muted">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-sm">Loading conversation…</span>
                        </div>
                    ) : isEmptyState ? (
                        /* Empty state with quick commands */
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center h-full gap-6"
                        >
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                    <Zap className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-text mb-1">AI Pharmacy Assistant</h3>
                                <p className="text-sm text-text-muted max-w-xs">
                                    Manage stock, process orders, and get inventory insights — all through natural language.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                                {QUICK_COMMANDS.map(({ label, prompt, icon: Icon }) => (
                                    <button
                                        key={label}
                                        onClick={() => sendMessage(prompt)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-left hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group text-sm text-text-muted"
                                    >
                                        <Icon className="w-3.5 h-3.5 shrink-0 group-hover:text-primary transition-colors" />
                                        <span className="truncate text-[13px]">{label}</span>
                                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <AgentMessageBubble key={msg.id} message={msg} />
                                ))}
                            </AnimatePresence>
                            <AnimatePresence>
                                {isLoading && messages[messages.length - 1]?.role !== 'ai' && (
                                    <TypingIndicator />
                                )}
                            </AnimatePresence>
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="p-4 border-t border-black/5 dark:border-white/5 bg-card shrink-0">
                    <form
                        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg border border-black/5 dark:border-white/5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all"
                    >
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                // Auto-grow: reset then set to scrollHeight
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={isLoading ? 'Agent is thinking…' : 'Ask to add stock, update orders, or analyze inventory…'}
                            disabled={isLoading}
                            className="flex-1 bg-transparent border-none focus:outline-none text-[14px] text-text placeholder:text-text-muted/50 resize-none overflow-hidden disabled:opacity-50 transition-opacity leading-relaxed"
                            style={{ minHeight: '24px', maxHeight: '120px' }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 translate-x-px" />
                            )}
                        </button>
                    </form>
                    <p className="text-center mt-2 text-[11px] text-text-muted/50 font-medium">
                        Actions taken by this agent are real and affect live data. Review before confirming.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PharmacistAgent;
