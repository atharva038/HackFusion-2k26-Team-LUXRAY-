import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { fetchChatSessions, fetchChatHistory, deleteChatSession } from '../../services/api';
import { parseStructuredOutput } from '../../utils/parseStructuredOutput';

const ChatSidebar = () => {
    const { chatSessions, setChatSessions, currentSessionId, setCurrentSessionId, setMessages, clearMessages } = useAppStore();
    const [loading, setLoading] = useState(false);

    const loadSessions = async () => {
        try {
            const res = await fetchChatSessions();
            setChatSessions(res.sessions || []);
        } catch (err) {
            console.error('Failed to load sessions', err);
        }
    };

    useEffect(() => {
        loadSessions();
    }, [currentSessionId]); // Reload sessions when current session changes so titles update

    const handleNewChat = () => {
        clearMessages();
        setCurrentSessionId(null);
    };

    const handleSelectSession = async (id) => {
        if (id === currentSessionId) return;
        setLoading(true);
        setCurrentSessionId(id);
        try {
            const res = await fetchChatHistory(id);
            if (res.history) {
                const formatted = res.history.map((msg, i) => ({
                    id: i,
                    role: msg.role,
                    text: msg.content,
                    tools: [],
                    structured: msg.role === 'ai' ? parseStructuredOutput(msg.content) : null,
                }));
                if (formatted.length === 0) {
                    clearMessages();
                } else {
                    setMessages(formatted);
                }
            }
        } catch (err) {
            console.error('Failed to load history', err);
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteChatSession(id);
            setChatSessions(chatSessions.filter(s => s._id !== id));
            if (currentSessionId === id) {
                handleNewChat();
            }
        } catch (err) {
            console.error('Failed to delete session', err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card/50 backdrop-blur-md border-r border-black/5 dark:border-white/5 w-64 md:w-72 flex-shrink-0 relative z-20 transition-all duration-300">
            <div className="p-4 border-b border-black/5 dark:border-white/5">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 px-4 rounded-xl transition-colors font-medium text-sm border border-primary/20"
                >
                    <Plus className="w-4 h-4" /> New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
                <div className="text-xs font-semibold text-text-muted/70 uppercase tracking-wider mb-3 px-2">History</div>

                {chatSessions.length === 0 && !loading && (
                    <div className="text-sm text-center text-text-muted pt-4">No recent chats.</div>
                )}

                {loading && chatSessions.length === 0 && (
                    <div className="flex justify-center pt-4">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                )}

                {chatSessions.map((session) => (
                    <div
                        key={session._id}
                        onClick={() => handleSelectSession(session._id)}
                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${currentSessionId === session._id
                            ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text'
                            }`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${currentSessionId === session._id ? 'text-primary' : 'text-text-muted/60 group-hover:text-text-muted'}`} />
                            <span className="text-sm truncate w-36 font-medium tracking-tight">
                                {session.title || 'New Chat'}
                            </span>
                        </div>
                        <button
                            onClick={(e) => handleDelete(e, session._id)}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${currentSessionId === session._id
                                ? 'text-primary/70 hover:bg-primary/20 hover:text-red-500'
                                : 'text-text-muted/50 hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100'
                                }`}
                            title="Delete Chat"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Loading Overlay */}
            {loading && chatSessions.length > 0 && (
                <div className="absolute inset-0 bg-bg/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-r-xl">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
            )}
        </div>
    );
};

export default ChatSidebar;
