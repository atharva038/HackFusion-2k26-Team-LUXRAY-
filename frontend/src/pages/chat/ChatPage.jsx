import React from 'react';
import Header from '../../components/layout/Header';
import AiAvatar from '../../components/avatar/AiAvatar';
import ChatArea from '../../components/chat/ChatArea';

const ChatPage = () => {
    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-bg text-text transition-colors duration-500">
            <Header />

            <main className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto overflow-hidden relative">

                {/* Left Side: Avatar Panel */}
                <section className="
                    w-full h-[220px] md:h-full md:w-[38%] lg:w-[40%]
                    flex-shrink-0
                    border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5
                    transition-colors duration-500
                    bg-gradient-to-b md:bg-gradient-to-br from-transparent via-primary/[0.02] to-primary/[0.05]
                    dark:from-transparent dark:via-primary/[0.03] dark:to-primary/[0.06]
                    relative z-10
                ">
                    <AiAvatar />
                </section>

                {/* Right Side: Chat Panel */}
                <section className="w-full md:flex-1 h-full flex flex-col relative bg-bg transition-colors duration-500 z-0">
                    <ChatArea />
                </section>

            </main>
        </div>
    );
};

export default ChatPage;
