import React, { useEffect, useRef } from 'react';
import useAppStore from '../../store/useAppStore';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';

const ChatArea = () => {
    const { messages, isTyping } = useAppStore();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Messages List Area (Full width for right-edge scrollbar, content centered) */}
            <div className="flex-1 overflow-y-auto pt-6 pb-36 w-full z-0 transition-all duration-300">
                <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-6">
                    {messages.map((msg, idx) => (
                        <MessageBubble key={idx} message={msg} />
                    ))}

                    {isTyping && (
                        <div className="flex justify-start animate-fade-in-up mt-2">
                            <div className="px-5 py-3.5 rounded-3xl rounded-tl-sm bg-card text-text shadow-sm border border-black/5 dark:border-white/5 opacity-70">
                                <div className="flex items-center gap-1.5 h-6 text-primary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-6" />
                </div>
            </div>

            {/* Sticky Input Area without Glass Blur to address user feedback */}
            <div className="absolute bottom-0 left-0 right-0 pb-4 pt-2 pointer-events-none z-20">
                <div className="pointer-events-auto max-w-4xl mx-auto px-4 md:px-8">
                    <InputArea />
                </div>
            </div>
        </div>
    );
};

export default ChatArea;
