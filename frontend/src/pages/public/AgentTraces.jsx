import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Box, BrainCircuit, ShieldAlert, Cpu, ArrowRight, Server, Repeat, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/layout/Header';

const ACTION_ICONS = {
    'AI Reasoning': <BrainCircuit className="w-4 h-4 text-purple-500" />,
    '⚙️ Tool: order_medicine': <Box className="w-4 h-4 text-amber-500" />,
    '⚙️ Tool: create_payment': <Activity className="w-4 h-4 text-green-500" />,
    '⚙️ Tool: check_prescription_on_file': <ShieldAlert className="w-4 h-4 text-red-500" />,
    '🤝 Handoff': <ArrowRight className="w-4 h-4 text-blue-500" />,
    '💬 Response': <Activity className="w-4 h-4 text-indigo-500" />,
    '📦 Result: order_medicine': <Box className="w-4 h-4 text-amber-500" />,
    '📦 Result: create_payment': <Activity className="w-4 h-4 text-green-500" />,
    '📦 Result: check_prescription_on_file': <ShieldAlert className="w-4 h-4 text-red-500" />,
    'Using Tool: executeImageExtraction': <Server className="w-4 h-4 text-cyan-500" />,
    'Tool Result: executeImageExtraction': <Server className="w-4 h-4 text-cyan-500" />,
    'Final Structuring': <Box className="w-4 h-4 text-indigo-500" />,
    'default': <Cpu className="w-4 h-4 text-gray-400" />
};

export default function AgentTraces() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchTraces = async () => {
        setIsRefreshing(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const baseUrl = apiUrl.replace(/\/api\/?$/, '');
            const res = await fetch(`${baseUrl}/api/traces`);
            if (!res.ok) throw new Error('Failed to load traces');
            const data = await res.json();
            setLogs(data.traces || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setTimeout(() => setIsRefreshing(false), 500); // UI feel
        }
    };

    useEffect(() => {
        fetchTraces();
        // Auto-refresh every 10 seconds for a "live monitor" feel
        const interval = setInterval(fetchTraces, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !logs.length) {
        return (
            <div className="min-h-screen bg-bg text-text p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-text-muted font-medium">Connecting to system logs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg text-text p-8 flex flex-col items-center justify-center">
                <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Monitor Connection Lost</h2>
                <p className="text-text-muted">{error}</p>
                <button
                    onClick={fetchTraces}
                    className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg text-text font-sans selection:bg-primary/30">
            <Header />
            <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex-1 z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-8 border-b border-black/5 dark:border-white/5">

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                <Terminal className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-text">
                                Agent Traces
                            </h1>
                        </div>
                        <p className="text-text-muted text-base max-w-2xl pl-1">
                            Real-time observability into the conversational reasoning, tool execution, and orchestration.
                        </p>
                    </div>

                    <button
                        onClick={fetchTraces}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-black/10 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-xl text-sm font-medium transition-all duration-200 w-fit disabled:opacity-50 text-text shadow-sm"
                    >
                        <Repeat className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Syncing...' : 'Refresh'}
                    </button>
                </div>

                {/* Logs Feed */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {logs.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-16 text-text-muted bg-card border border-black/5 dark:border-white/5 rounded-2xl shadow-soft"
                            >
                                <Terminal className="w-10 h-10 mx-auto mb-3 text-primary/40" />
                                <p className="text-base font-medium text-text">No system traces found.</p>
                                <p className="text-sm">Interact with the assistant to generate logs.</p>
                            </motion.div>
                        ) : (
                            logs.map((log) => (
                                <TraceCard key={log._id} log={log} />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

const TraceCard = ({ log }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine overall status color
    const statusColor =
        log.status === 'success' ? 'bg-green-500' :
            log.status === 'blocked' ? 'bg-amber-500' : 'bg-red-500';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group rounded-xl border border-black/5 dark:border-white/5 bg-card overflow-hidden shadow-soft transition-all duration-300 hover:shadow-md"
        >
            {/* Run Header (Clickable to toggle) */}
            <div
                className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors duration-200 ${isExpanded ? 'bg-black/[0.02] dark:bg-white/[0.02]' : 'hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'} border-b border-black/5 dark:border-white/5`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                        <h3 className="font-semibold text-text text-sm uppercase tracking-wider">
                            {log.sessionId === 'prescription_upload' ? 'Prescription OCR' : 'Chat Interaction'}
                        </h3>
                    </div>
                    <p className="text-[15px] text-text font-medium truncate w-full">
                        "{log.userMessage}"
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text-muted mt-1 sm:mt-0">
                    <span className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-md border border-black/5 dark:border-white/5">
                        <Activity className="w-3.5 h-3.5" />
                        {log.durationMs}ms
                    </span>
                    <span className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-md border border-black/5 dark:border-white/5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                    <div className="ml-1 text-text-muted">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {/* Trace Steps / Timeline (Animated Dropdown) */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-bg"
                    >
                        <div className="p-5 md:p-6 text-[13px]">
                            <div className="relative pl-5 space-y-6 before:absolute before:inset-y-2 before:left-[9px] before:w-[2px] before:bg-black/10 dark:before:bg-white/10 rounded">
                                {log.traces.map((trace, idx) => {
                                    const icon = ACTION_ICONS[trace.action] || ACTION_ICONS[trace.action.replace(/:.*/, ':')] || ACTION_ICONS['default'];

                                    return (
                                        <div key={idx} className="relative">
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[29px] mt-[2px] bg-card p-1 rounded-full border border-black/5 dark:border-white/5 z-10 ring-4 ring-bg">
                                                {icon}
                                            </div>

                                            <div className="space-y-2 w-full min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                                                    <span className="font-semibold text-text">{trace.agent}</span>
                                                    <span className="text-text-muted">→</span>
                                                    <span className="font-medium text-text-muted">
                                                        {trace.action}
                                                    </span>
                                                </div>

                                                <div className="bg-card rounded-lg p-3.5 text-text-muted border border-black/5 dark:border-white/5 whitespace-pre-wrap break-words max-h-64 overflow-y-auto w-full custom-scrollbar leading-relaxed font-mono text-[12px]">
                                                    {formatData(trace.data)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Final Answer Footer */}
            {log.agentResponse && log.sessionId !== 'prescription_upload' && (
                <div className="px-5 py-4 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                    <h4 className="text-[12px] font-semibold tracking-wide mb-1.5 flex items-center gap-1.5 text-text">
                        <CheckCircle2Icon status={log.status} /> Final Response
                    </h4>
                    <p className="text-[14px] text-text-muted leading-relaxed">
                        {log.agentResponse}
                    </p>
                </div>
            )}
        </motion.div>
    );
};

// Helper to format unstructured trace data beautifully
const formatData = (data) => {
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return data;
        }
    }
    return JSON.stringify(data, null, 2);
};

const CheckCircle2Icon = ({ status }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14" height="14"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={status === 'success' ? 'text-green-500' : 'text-amber-500'}
    >
        <path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);
