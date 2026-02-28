import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import AiAvatar from '../../components/avatar/AiAvatar';
import ChatArea from '../../components/chat/ChatArea';
import ChatSidebar from '../../components/chat/ChatSidebar';

const ChatPage = ({ onOpenAllergies }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-bg text-text transition-colors duration-500">
            {/* Minimal Header */}
            <Header
                onOpenAllergies={onOpenAllergies}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            <main className="flex-1 flex w-full h-[calc(100vh-4rem)] max-w-[1600px] mx-auto overflow-hidden relative bg-bg">

                {/* Sidebar Overlay (Mobile) */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Left Sidebar: Navigation & History */}
                <div className={`
                    absolute md:relative inset-y-0 left-0 z-50
                    transform transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0 md:w-80' : '-translate-x-full md:w-0 md:opacity-0 md:overflow-hidden'}
                    h-full shadow-2xl md:shadow-none bg-bg
                `}>
                    <div className="w-80 h-full">
                        <ChatSidebar />
                    </div>
                </div>

                {/* Right Area: Main Chat Experience */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
                    {/* Top Centered AI Orb */}
                    <div className="shrink-0 absolute top-0 left-0 right-0 z-30 pointer-events-none pb-4 bg-gradient-to-b from-bg via-bg/80 to-transparent">
                        <div className="pointer-events-auto">
                            <AiAvatar />
                        </div>
                    </div>

                    {/* Chat Stream Data */}
                    <section className="flex-1 h-full flex flex-col pt-16 relative bg-bg transition-colors duration-500 z-10">
                        <ChatArea />
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ChatPage;
