import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Header from '../../components/layout/Header';
import AiAvatar from '../../components/avatar/AiAvatar';
import ChatArea from '../../components/chat/ChatArea';
import ChatSidebar from '../../components/chat/ChatSidebar';

const ChatPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-bg text-text transition-colors duration-500">
            <Header />

            <main className="flex-1 flex w-full max-w-[1600px] mx-auto overflow-hidden relative bg-bg">

                {/* Sidebar Overlay (Mobile) */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`
                    absolute md:relative inset-y-0 left-0 z-50
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 h-full
                `}>
                    <ChatSidebar />
                </div>

                {/* Main Chat Content */}
                <div className="flex-1 flex flex-col md:flex-row min-w-0 h-full">

                    {/* Left/Top Side: Avatar Panel */}
                    <section className="
                        relative
                        w-full h-[220px] md:h-full md:w-[35%] lg:w-[40%]
                        flex-shrink-0
                        border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5
                        transition-colors duration-500
                        bg-gradient-to-b md:bg-gradient-to-br from-transparent via-primary/[0.02] to-primary/[0.05]
                        dark:from-transparent dark:via-primary/[0.03] dark:to-primary/[0.06]
                        z-10
                    ">
                        {/* Mobile Sidebar Toggle Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden absolute top-4 left-4 z-20 p-2 bg-card/80 backdrop-blur border border-black/5 dark:border-white/5 rounded-lg shadow-sm text-text"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <AiAvatar />
                    </section>

                    {/* Right Side: Chat Panel */}
                    <section className="w-full md:flex-1 h-full flex flex-col relative bg-bg transition-colors duration-500 z-0">
                        <ChatArea />
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ChatPage;
