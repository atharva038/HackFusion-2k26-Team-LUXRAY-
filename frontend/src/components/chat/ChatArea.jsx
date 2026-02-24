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
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto md:mr-auto pb-4 px-4 md:px-8">

            {/* Messages List Area */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="max-w-[75%] px-5 py-3.5 rounded-2xl rounded-tl-sm bg-card text-text shadow-sm border border-black/5 dark:border-white/5 opacity-70">
                            <div className="flex items-center gap-1.5 h-6 text-primary">
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="shrink-0 pt-2 shrink-0">
                <InputArea />
            </div>

        </div>
    );
};

export default ChatArea;
