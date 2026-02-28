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
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative px-4 md:px-8">
            {/* Top Gradient Fade to hide hard edge */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-bg to-transparent z-10 pointer-events-none" />

            {/* Messages List Area */}
            <div className="flex-1 overflow-y-auto pt-6 pb-36 space-y-6 scrollbar-hide z-0">
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

            {/* Sticky Input Area with Glass Blur */}
            <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-4 pt-6 bg-gradient-to-t from-bg via-bg/90 to-transparent pointer-events-none z-20">
                <div className="pointer-events-auto max-w-4xl mx-auto">
                    <InputArea />
                </div>
            </div>
        </div>
    );
};

export default ChatArea;
