import React, { useEffect, useState } from 'react';
import {
    BrainCircuit, Bot, Languages, ScanFace, CreditCard, ShieldCheck,
    Zap, Share2, Layers, Search, Database, Lock, Cpu, Server, CheckCircle2,
    Code2, FileJson, ArrowRight, ArrowRightCircle, AlertTriangle, Activity, ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Agent Flowchart (Digital) ─────────────────────────────────────────────────

// Transparent tinted style — no gradients, no glow, pure digital
const PIPE = {
    entry:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-300',  icon: 'bg-emerald-500/20 border-emerald-500/30' },
    output:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-300',  icon: 'bg-emerald-500/20 border-emerald-500/30' },
    parent:  { bg: 'bg-blue-500/10',    border: 'border-blue-500/40',    text: 'text-blue-300',     icon: 'bg-blue-500/20 border-blue-500/30'        },
    child:   { bg: 'bg-teal-500/10',    border: 'border-teal-500/35',    text: 'text-teal-300',     icon: 'bg-teal-500/20 border-teal-500/28'        },
    guard:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   text: 'text-amber-200',    icon: 'bg-amber-500/20 border-amber-500/30'      },
    blocked: { bg: 'bg-red-500/10',     border: 'border-red-500/35',     text: 'text-red-300',      icon: 'bg-red-500/20 border-red-500/28'          },
    legacy:  { bg: 'bg-slate-400/[0.07]', border: 'border-slate-400/30', text: 'text-slate-300',    icon: 'bg-slate-400/15 border-slate-400/22'      },
};

const PNode = ({ emoji, title, sub, type }) => {
    const p = PIPE[type];
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${p.bg} border ${p.border} max-w-[260px] w-full`}>
            <div className={`w-8 h-8 rounded-lg ${p.icon} border flex items-center justify-center shrink-0`}>
                <span className="text-sm leading-none">{emoji}</span>
            </div>
            <div className="min-w-0">
                <p className={`font-bold text-[13px] leading-tight tracking-tight ${p.text}`}>{title}</p>
                {sub && <p className="text-[10px] text-white/30 font-mono mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
    );
};

const PArrow = ({ label }) => (
    <div className="flex flex-col items-center my-2 shrink-0">
        <div className="w-px h-5 bg-white/10" />
        {label && (
            <div className="flex items-center gap-2 my-1.5">
                <div className="h-px w-5 bg-white/8" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400/80 border border-emerald-700/35 px-2.5 py-0.5 rounded-full">
                    {label}
                </span>
                <div className="h-px w-5 bg-white/8" />
            </div>
        )}
        <div className="w-px h-5 bg-white/10" />
        <svg width="9" height="5" viewBox="0 0 9 5" fill="none" aria-hidden="true">
            <path d="M4.5 5L0.602 0.5H8.398L4.5 5Z" fill="rgba(255,255,255,0.15)" />
        </svg>
    </div>
);

const ToolChip = ({ label }) => (
    <div className="flex items-center gap-2 bg-violet-500/[0.08] border border-violet-500/25 hover:border-violet-400/40 rounded-lg px-2.5 py-1.5 transition-colors cursor-default">
        <div className="w-1 h-1 rounded-full bg-violet-400/50 shrink-0" />
        <span className="text-[10px] font-mono text-violet-300/80">{label}</span>
    </div>
);

const ChildCard = ({ emoji, title, sub, tools }) => (
    <div className="flex-1 min-w-0 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex flex-col gap-2">
        <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${PIPE.child.bg} border ${PIPE.child.border}`}>
            <div className={`w-7 h-7 rounded-md ${PIPE.child.icon} border flex items-center justify-center shrink-0`}>
                <span className="text-xs leading-none">{emoji}</span>
            </div>
            <div className="min-w-0">
                <p className={`font-bold text-[12px] leading-tight tracking-tight ${PIPE.child.text}`}>{title}</p>
                {sub && <p className="text-[9px] text-white/28 font-mono mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <p className="text-[9px] text-white/18 uppercase font-bold tracking-widest pl-0.5 mb-0.5">Tools</p>
            {tools.map(t => <ToolChip key={t} label={t} />)}
        </div>
    </div>
);

const BlockedBadge = () => (
    <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex flex-col items-center gap-1">
            <div className="h-px w-8 bg-red-500/40" />
            <svg width="7" height="4" viewBox="0 0 7 4" fill="none" aria-hidden="true">
                <path d="M3.5 4L0 0H7L3.5 4Z" fill="rgba(239,68,68,0.4)" />
            </svg>
        </div>
        <div className={`${PIPE.blocked.bg} border ${PIPE.blocked.border} rounded-xl px-3 py-2.5 shrink-0`}>
            <p className={`font-bold text-xs ${PIPE.blocked.text}`}>🚫 Blocked</p>
            <p className="text-[10px] text-red-400/45 font-mono mt-0.5">Malicious / Unsafe</p>
        </div>
    </div>
);

const GuardRow = ({ emoji, title, sub }) => (
    <div className="flex items-center justify-center gap-4 w-full">
        <PNode emoji={emoji} title={title} sub={sub} type="guard" />
        <BlockedBadge />
    </div>
);

const FlowDivider = ({ label }) => (
    <div className="flex items-center gap-3 w-full my-4">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest shrink-0">{label}</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
);

const CustomerChatFlow = () => (
    <div className="flex flex-col items-center w-full">
        <PNode emoji="👤" title="Customer Request" type="entry" />
        <PArrow />
        <GuardRow emoji="🛡️" title="Input Guard" sub="pharmacy_input_guardrail" />
        <PArrow label="✅ Allowed" />
        <PNode emoji="🧠" title="Parent Agent" sub="Routes by intent" type="parent" />
        <PArrow />
        <FlowDivider label="Delegates to child agent" />
        <div className="flex flex-col md:flex-row gap-3 w-full">
            <ChildCard emoji="💬" title="Receptionist" sub="medicine_advisor_stock_reader" tools={['checkStock', 'searchMedByDescription', 'describeMed']} />
            <ChildCard emoji="🛒" title="Order Maker" sub="order_maker" tools={['order_medicine', 'checkPrescriptionOnFile', 'create_payment']} />
        </div>
        <PArrow />
        <GuardRow emoji="🛡️" title="Output Guard" sub="pharmacy_output_guardrail" />
        <PArrow label="✅ Safe" />
        <PNode emoji="📤" title="Response to Customer" type="output" />
    </div>
);

const PharmacistFlow = () => (
    <div className="flex flex-col items-center w-full">
        <PNode emoji="💊" title="Pharmacist Request" type="entry" />
        <PArrow />
        <GuardRow emoji="🛡️" title="Pharmacist Input Guard" sub="pharmacistInputGuardrail" />
        <PArrow label="✅ Allowed" />
        <PNode emoji="🧠" title="Parent Pharmacist" sub="Routes by intent" type="parent" />
        <PArrow />
        <FlowDivider label="Delegates to child agent" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 w-full">
            {[
                { emoji: '📦', title: 'Stock Add',       sub: 'stockAddAgent',           tools: ['addStockTool'] },
                { emoji: '📉', title: 'Stock Reduce',    sub: 'stockReduceAgent',         tools: ['reduceStockTool'] },
                { emoji: '🔄', title: 'Order Status',    sub: 'orderStatusChangeAgent',   tools: ['getOrdersTool', 'changeOrderStatusTool'] },
                { emoji: '📊', title: 'Inv. Suggestion', sub: 'inventorySuggestionAgent', tools: ['getRecentTransactionsTool'] },
                { emoji: '🏭', title: 'Place Order',     sub: 'placeOrderAgent',          tools: ['placeOrderTool'] },
                { emoji: '➕', title: 'Add Medicine',    sub: 'addMedicineAgent',          tools: ['addMedicineTool'] },
                { emoji: '➖', title: 'Remove Medicine', sub: 'removeMedicineAgent',       tools: ['removeMedicineTool'] },
            ].map(c => (
                <div key={c.title} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex flex-col gap-1.5">
                    <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${PIPE.child.bg} border ${PIPE.child.border}`}>
                        <span className="text-sm shrink-0">{c.emoji}</span>
                        <div className="min-w-0">
                            <p className={`font-bold text-[11px] leading-tight ${PIPE.child.text}`}>{c.title}</p>
                            <p className="text-white/28 text-[9px] font-mono truncate">{c.sub}</p>
                        </div>
                    </div>
                    {c.tools.map(t => <ToolChip key={t} label={t} />)}
                </div>
            ))}
        </div>
        <PArrow />
        <GuardRow emoji="🛡️" title="Pharmacist Output Guard" sub="pharmacistOutputGuardrail" />
        <PArrow label="✅ Safe" />
        <PNode emoji="📤" title="Response to Pharmacist" type="output" />
    </div>
);

const NotificationFlow = () => (
    <div className="flex flex-col items-center w-full">
        <PNode emoji="⏰" title="Scheduler / Cron Job" type="entry" />
        <PArrow />
        <PNode emoji="🧠" title="Notification Dispatcher" sub="Routes by task type" type="parent" />
        <PArrow />
        <FlowDivider label="Delegates to child agent" />
        <div className="flex flex-col md:flex-row gap-3 w-full">
            <ChildCard emoji="💊" title="Medication Notifier" sub="medication_notifier" tools={['fetchDosesTool', 'sendEmailTool']} />
            <ChildCard emoji="🔁" title="Refill Reminder" sub="refill_reminder_agent" tools={['fetchRefillsTool', 'sendEmailTool']} />
        </div>
        <div className="mt-6 w-full max-w-md bg-blue-500/[0.07] border border-blue-500/25 rounded-xl px-5 py-3 text-center">
            <p className="text-sm text-blue-300/70">ℹ️ <strong className="text-blue-200/90">No Guardrails</strong> — Trusted internal cron jobs, not user-facing input.</p>
        </div>
    </div>
);

const LegacyFlow = () => (
    <div className="flex flex-col items-center w-full">
        <PNode emoji="👤" title="Customer Request" sub="via Legacy Route" type="entry" />
        <PArrow />
        <PNode emoji="🤖" title="Orchestrator Agent" sub="runOrchestrator · Agentic Loop · GPT-4o" type="legacy" />
        <FlowDivider label="Bidirectional Tool Loop ⇄" />
        <div className="flex flex-col gap-1.5 w-full max-w-xs">
            {['check_inventory', 'validate_prescription', 'create_order', 'check_warehouse', 'check_refill_eligibility'].map(t => (
                <div key={t} className="flex items-center gap-2">
                    <span className="text-white/18 text-[10px] shrink-0 font-mono w-4">⇄</span>
                    <ToolChip label={t} />
                </div>
            ))}
        </div>
        <div className="mt-6 w-full max-w-sm bg-amber-500/[0.07] border border-amber-500/25 rounded-xl px-5 py-3 text-center">
            <p className="text-sm text-amber-300/70">⚠️ <strong className="text-amber-200/90">Deprecated</strong> — Replaced by the multi-pipeline SDK architecture above.</p>
        </div>
    </div>
);

// ── End Flowchart ─────────────────────────────────────────────────────────────

const ProjectShowcase = () => {
    const [activeTab, setActiveTab] = useState('customer');

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-emerald-200">
            {/* Navigation Bar */}
            <div className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-4 pointer-events-none">
                <Link to="/" className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm px-4 py-2 rounded-full text-sm font-bold text-slate-700 hover:text-emerald-600 hover:border-emerald-200 transition-colors pointer-events-auto">
                    <ChevronLeft className="w-4 h-4" />
                    Back to App
                </Link>
            </div>

            {/* 1. Hero Section */}
            <section className="relative pt-24 pb-16 px-4 sm:px-6 max-w-6xl mx-auto overflow-hidden">
                <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8">
                        <span className="flex h-2 w-2 relative mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold tracking-widest text-slate-600 uppercase">Production Grade System</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm leading-tight">
                        MediSage <span className="text-primary font-light">Architecture</span>
                    </h1>

                    <p className="text-xl md:text-2xl font-medium text-slate-600 max-w-3xl mb-12 leading-relaxed">
                        This is not a demo UI. <br className="hidden md:block" />
                        This is a fully engineered, deterministic AI commerce system.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
                        {[
                            { icon: BrainCircuit, label: 'Agentic AI' },
                            { icon: Languages, label: 'Multilingual Voice' },
                            { icon: CreditCard, label: 'Razorpay Webhooks' },
                            { icon: AlertTriangle, label: 'FDA Allergy Checks' },
                            { icon: Zap, label: 'Redis Caching' },
                            { icon: Search, label: 'Granular Tracing' },
                            { icon: ScanFace, label: 'OCR Prescription Parsing' },
                            { icon: ShieldCheck, label: 'Admin Access Control' }
                        ].map((badge, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-sm text-sm font-semibold text-slate-700 hover:border-primary/30 transition-colors">
                                <badge.icon className="w-4 h-4 text-primary" />
                                {badge.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Multi-Agent Pipeline Flowchart ───────────────────────────────── */}
            <section className="relative py-20 px-4 sm:px-6 overflow-hidden bg-[#060b17]">
                {/* Fine dot grid — no bloom, pure structure */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                />
                {/* Very faint top edge line */}
                <div className="absolute top-0 inset-x-0 h-px bg-white/[0.05]" />

                <div className="max-w-5xl mx-auto relative z-10">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                            Agent Architecture
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                            Multi-Agent Pipeline Chain
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
                            Four independent AI pipelines — Customer Chat, Pharmacist Operations, Scheduled Notifications, and Legacy Orchestrator — each with safety guardrails, parent routers, and specialized child agents.
                        </p>
                    </div>

                    {/* Tab selector */}
                    <div className="flex justify-center gap-2 mb-8 flex-wrap">
                        {[
                            { id: 'customer',     label: '👤 Customer Chat' },
                            { id: 'pharmacist',   label: '💊 Pharmacist' },
                            { id: 'notification', label: '🔔 Notification' },
                            { id: 'legacy',       label: '⚙️ Legacy' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/15 scale-105'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/8 hover:text-slate-200 border border-white/[0.07]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Flowchart panel */}
                    <div className="bg-white/[0.025] rounded-2xl border border-white/[0.08] p-6 md:p-10 overflow-x-auto">
                        <div className="min-w-[480px]">
                            {activeTab === 'customer'     && <CustomerChatFlow />}
                            {activeTab === 'pharmacist'   && <PharmacistFlow />}
                            {activeTab === 'notification' && <NotificationFlow />}
                            {activeTab === 'legacy'       && <LegacyFlow />}
                        </div>
                    </div>

                    {/* Color legend */}
                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 justify-center">
                        {[
                            { dot: 'bg-emerald-500', label: 'Entry / Output' },
                            { dot: 'bg-blue-500',    label: 'Parent Router' },
                            { dot: 'bg-teal-500',    label: 'Child Specialist' },
                            { dot: 'bg-amber-400',   label: 'Guardrail' },
                            { dot: 'bg-violet-500',  label: 'Tool' },
                            { dot: 'bg-red-500',     label: 'Blocked' },
                            { dot: 'bg-slate-500',   label: 'Legacy' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                                <span className="text-xs text-slate-500">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. Complete Feature Breakdown */}
            <section className="py-16 lg:py-20 px-4 sm:px-6 bg-white border-y border-slate-100">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center text-slate-900">Engineered Features</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'AI Conversational Ordering',
                                text: 'Natural language shopping cart manipulation using deterministic tool calls.',
                                tech: 'OpenAI Function Calling + Express Context',
                                prod: 'Validation bounds ensure AI cannot invent products.'
                            },
                            {
                                title: 'Prescription OCR Engine',
                                text: 'Extracts structured medicine data from uploaded images automatically.',
                                tech: 'Vision API + JSON Schema Enforcer',
                                prod: 'Raw text is mapped strictly to database inventory.'
                            },
                            {
                                title: 'Webhook Payment Processing',
                                text: 'Asynchronous state updates guaranteeing no dropped orders on disconnect.',
                                tech: 'Razorpay Webhooks + Signature Verification',
                                prod: 'Idempotent handling prevents double-charging.'
                            },
                            {
                                title: 'Multilingual Voice (TTS/STT)',
                                text: 'Seamlessly translate queries and stream lifelike audio responses.',
                                tech: 'Whisper + Streaming TTS APIs',
                                prod: 'Parallelization minimizes Time-To-First-Byte.'
                            },
                            {
                                title: 'Redis Performance Layer',
                                text: 'Sub-10ms latency for conversational history retrieval and auth sessions.',
                                tech: 'Redis Hashes & Pub/Sub',
                                prod: 'Significantly reduces MongoDB load during high concurrency.'
                            },
                            {
                                title: 'Agent Tracing System',
                                text: 'Real-time observation of AI agent thoughts, tool invocations, and latency.',
                                tech: 'Custom Middleware + React Trace Board',
                                prod: 'Provides administrative verifiability of every AI decision.'
                            }
                        ].map((feat, idx) => (
                            <div key={idx} className="bg-[#f0f4f8]/50 p-6 rounded-3xl border border-slate-200/50 hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{feat.title}</h3>
                                <p className="text-slate-600 mb-4 text-sm leading-relaxed">{feat.text}</p>
                                <div className="space-y-2 mt-auto">
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">Architecture</p>
                                        <p className="text-xs font-mono text-primary font-semibold">{feat.tech}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">Production Standard</p>
                                        <p className="text-xs font-medium text-emerald-600">{feat.prod}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2.5 Pharmacist AI Agent Showcase */}
            <section className="py-16 lg:py-20 px-4 sm:px-6 bg-slate-900 border-y border-slate-800 text-white overflow-hidden">
                <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row-reverse items-center gap-12">
                    {/* Feature Description */}
                    <div className="w-full lg:w-1/2 space-y-6">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-2">
                            Admin Subsystem
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            Autonomous Pharmacist Agent
                        </h2>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            The system is not just for customers. Administrators and pharmacists have access to their own dedicated AI agent capable of full backend manipulation via natural language.
                        </p>

                        <ul className="space-y-4 mt-8">
                            {[
                                "Accept or Reject pending orders instantly.",
                                "View and filter pending user orders accurately.",
                                "Manage Inventory: dynamically fill up or reduce stock levels.",
                                "Order on behalf of the user when requested in an emergency."
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                    <span className="text-slate-200 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Video Player */}
                    <div className="w-full lg:w-1/2 flex-shrink-0 relative rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl shadow-primary/20">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none z-10" />
                        <video
                            src="https://res.cloudinary.com/dgqwcgjfy/video/upload/v1772255300/hackfusion/showcase/pharma_ai_agent_demo.mp4"
                            controls
                            autoPlay
                            muted
                            loop
                            className="w-full h-auto object-cover relative z-0"
                        />
                        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <Bot className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-white tracking-wide">Live Agent Demo</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2.6 Prescription OCR Engine Showcase */}
            <section className="py-16 lg:py-20 px-4 sm:px-6 bg-indigo-50/50 border-y border-indigo-100 text-slate-800 overflow-hidden">
                <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12">
                    {/* Feature Description */}
                    <div className="w-full lg:w-1/2 space-y-6">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-2">
                            Computer Vision Layer
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Prescription OCR Engine
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Transform handwritten or printed prescriptions into intelligent, actionable cart items. Our Vision API instantly parses complex medical imagery into structured JSON objects.
                        </p>

                        <ul className="space-y-4 mt-8">
                            {[
                                "Automatically extracts tablet names, dosages, and quantities.",
                                "Strictly maps scanned text to available database inventory.",
                                "Handles low-light and distorted document uploads gracefully.",
                                "Eliminates manual entry entirely, streamlining the user journey."
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <ScanFace className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                                    <span className="text-slate-700 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Video Player */}
                    <div className="w-full lg:w-1/2 flex-shrink-0 relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 bg-white border-4 border-slate-100 p-2">
                        <div className="rounded-2xl overflow-hidden relative border border-slate-200 bg-slate-100">
                            <video
                                src="https://res.cloudinary.com/dgqwcgjfy/video/upload/v1772258532/hackfusion/showcase/by08wjgzdubpdhkfdbku.mp4"
                                controls
                                autoPlay
                                muted
                                loop
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                <ScanFace className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-bold text-slate-800 tracking-wide">Live OCR Extraction</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2.7 FDA Allergy Intelligence Showcase */}
            <section className="py-16 lg:py-20 px-4 sm:px-6 bg-rose-50 border-y border-rose-100 text-slate-800">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-12">
                    {/* Feature Description */}
                    <div className="w-full lg:w-1/2 space-y-6">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold tracking-widest uppercase mb-2">
                            Patient Safety Guardrails
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            FDA Allergy Intelligence
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Patient safety is guaranteed at the orchestration layer. Before recommending or fulfilling any medication, the AI actively cross-references your medical profile and known allergies using structured <strong>FDA Drug Labels</strong>.
                        </p>

                        <ul className="space-y-4 mt-8">
                            {[
                                "Proactive Contraindication Warnings: Agent automatically halts if an allergen is detected.",
                                "Deep Graph Matching: Uses FDA APIs to inspect active chemical components.",
                                "Smart Alternatives: Recommends safe, equivalent medications instantly.",
                                "Zero-Shot Safety: Eliminates human error during the ordering process."
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <ShieldCheck className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                                    <span className="text-slate-700 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Chat visual representation */}
                    <div className="w-full lg:w-1/2 flex-shrink-0 relative rounded-3xl overflow-hidden shadow-2xl shadow-rose-500/10 bg-white border border-slate-200">
                        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                            </div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-2">Agent Evaluation Trace</div>
                        </div>
                        <div className="p-6 flex flex-col gap-6 font-sans">
                            {/* User Message */}
                            <div className="self-end bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm max-w-[85%]">
                                <p className="text-sm font-medium">I have a mild fever. I want to buy Combiflam.</p>
                            </div>

                            {/* Agent Thought Process */}
                            <div className="self-start max-w-[95%] bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm relative">
                                <div className="absolute -left-3 -top-3 bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
                                    <Activity className="w-4 h-4 text-rose-500" />
                                </div>
                                <div className="ml-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">FDA API Check Invoked</span>
                                        <span className="text-[10px] font-mono bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">get_drug_interactions</span>
                                    </div>
                                    <div className="text-xs text-slate-600 font-mono bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed shadow-inner">
                                        <div>&gt; User Context: Allergic to Ibuprofen.</div>
                                        <div>&gt; Target Drug: Combiflam</div>
                                        <div>&gt; FDA Match: Active ingredient [Ibuprofen, Paracetamol] found.</div>
                                        <div>&gt; Status: <span className="text-rose-600 font-bold">ALLERGY DETECTED</span>. Block transaction.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Response */}
                            <div className="self-start bg-rose-50 border border-rose-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm max-w-[90%] flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-rose-900 mb-1">Warning: Allergic Content Detected</p>
                                    <p className="text-sm text-rose-800 leading-relaxed">
                                        I cannot process an order for <strong>Combiflam</strong> because FDA drug labels indicate it contains <strong>Ibuprofen</strong>, which matches your known allergies.
                                    </p>
                                    <p className="text-sm text-rose-800 leading-relaxed mt-2">
                                        Would you like me to recommend a pure Paracetamol alternative like <span className="font-semibold underline decoration-rose-300 underline-offset-2">Dolo 650</span> that is safe for you?
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2.7 Multilingual Voice AI Showcase */}
            <section className="py-16 lg:py-20 px-4 sm:px-6 bg-slate-900 border-y border-slate-800 text-white overflow-hidden">
                <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12">
                    {/* Feature Description */}
                    <div className="w-full lg:w-1/2 space-y-6">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">
                            Accessibility First
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            Native Marathi Voice Agent
                        </h2>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Breaking language barriers in healthcare. Our AI agent seamlessly understands and responds in regional languages like Marathi through a fully localized voice interface.
                        </p>

                        <ul className="space-y-4 mt-8">
                            {[
                                "Real-time Speech-to-Text translation optimized for regional dialects.",
                                "Conversational ordering entirely in the user's native tongue.",
                                "Empowers rural and non-English speaking patients with cutting-edge AI.",
                                "Zero latency impact on the core orchestrator loops."
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                                    <span className="text-slate-200 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Video Player */}
                    <div className="w-full lg:w-1/2 flex-shrink-0 relative rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl shadow-blue-500/20">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none z-10" />
                        <video
                            src="https://res.cloudinary.com/dgqwcgjfy/video/upload/v1772257920/hackfusion/showcase/iej2h84bshlgukg5iwog.mp4"
                            controls
                            autoPlay
                            muted
                            loop
                            className="w-full h-auto object-cover relative z-0"
                        />
                        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <Languages className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-semibold text-white tracking-wide">Marathi Voice Interaction</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2.8 Redis Performance Layer Showcase */}
            <section className="py-16 lg:py-20 px-4 sm:px-6 bg-orange-50/50 border-y border-orange-100 text-slate-800 overflow-hidden">
                <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row-reverse items-center gap-12">
                    {/* Feature Description */}
                    <div className="w-full lg:w-1/2 space-y-6">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-bold tracking-widest uppercase mb-2">
                            High-Speed Data Layer
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Redis Performance Architecture
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Serving data at the speed of thought. Our custom Redis caching layer guarantees sub-10ms response times for all critical database operations, offloading immense read volume from the master database.
                        </p>

                        <ul className="space-y-4 mt-8">
                            {[
                                "In-memory caching for massive catalogs and user sessions.",
                                "Ensures the highest concurrency support without system degradation.",
                                "Asynchronous invalidation algorithms maintain absolute data consistency.",
                                "Near-instantaneous TTFB during complex AI evaluations."
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                                    <span className="text-slate-700 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Video Player */}
                    <div className="w-full lg:w-1/2 flex-shrink-0 relative rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/10 bg-white border-4 border-slate-100 p-2">
                        <div className="rounded-2xl overflow-hidden relative border border-slate-200 bg-slate-100">
                            <video
                                src="https://res.cloudinary.com/dgqwcgjfy/video/upload/v1772258089/hackfusion/showcase/jxewhtih368ausapticw.mp4"
                                controls
                                autoPlay
                                muted
                                loop
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                <Database className="w-4 h-4 text-orange-500" />
                                <span className="text-xs font-bold text-slate-800 tracking-wide">Redis Demo Trace</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Architecture Overview & 9. Demo Flow Visualization */}
            <section className="py-16 lg:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center text-slate-900">System Architecture & Flow</h2>

                <div className="bg-white p-6 md:p-12 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute inset-0 pattern-dots border-slate-200/50 opacity-10 pointer-events-none" />

                    <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-8 mb-12">
                        {/* Flow Diagram */}
                        <div className="flex-1 space-y-4 w-full">
                            {[
                                { name: 'Interface Layer', desc: 'React, Zustand, Renderers', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
                                { name: 'Agent Layer', desc: 'Intent Router, Context Handler', icon: Bot, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
                                { name: 'Tool Layer', desc: 'Strict JSON Validation', icon: Code2, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-100' },
                                { name: 'Service Layer', desc: 'Payment, Inventory, Auth', icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
                                { name: 'Data Layer', desc: 'MongoDB, Redis', icon: Database, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' }
                            ].map((layer, idx, arr) => (
                                <div key={idx} className="relative">
                                    <div className={`flex items-center p-4 rounded-2xl border ${layer.bg}`}>
                                        <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mr-4 shrink-0 ${layer.color}`}>
                                            <layer.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${layer.color}`}>{layer.name}</h4>
                                            <p className="text-sm text-slate-600 font-medium">{layer.desc}</p>
                                        </div>
                                    </div>
                                    {idx !== arr.length - 1 && (
                                        <div className="absolute left-10 top-full h-4 w-0.5 bg-slate-200" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        <div className="flex-1 md:pl-12 border-b md:border-b-0 md:border-l border-slate-200 pb-8 md:pb-0">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Strict Layer Separation</h3>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Our architecture strictly isolates the AI's reasoning capabilities from database access.
                                The <span className="font-semibold text-slate-800">Agent Layer</span> can only output structured JSON tool calls.
                                These calls are validated by the <span className="font-semibold text-slate-800">Tool Layer</span>,
                                which then safely delegates execution to the deterministic <span className="font-semibold text-slate-800">Service Layer</span>.
                            </p>
                            <div className="bg-[#fdfbf7] rounded-xl p-5 border border-slate-200">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Execution Flow</h4>
                                <ul className="space-y-2 font-mono text-xs sm:text-sm text-slate-700">
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500 shrink-0" /> User Input</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Orchestrator Routing</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Authorized Tool Invocation</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Service Execution</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Webhook Async Confirmation</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-primary shrink-0" /> UI Render (Socket.io)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="bg-slate-900 py-16 lg:py-20 px-4 sm:px-6 text-slate-300">
                <div className="max-w-6xl mx-auto space-y-16">
                    {/* 4. AI System Internals & 5. Tech Stack */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                <Cpu className="text-primary" /> AI System Internals
                            </h2>
                            <ul className="space-y-5">
                                <li className="flex gap-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                    <p><strong>Orchestrator Agent:</strong> A master routing agent classifies intent and transfers state to specialized sub-agents (e.g., Pharmacist, Checkout).</p>
                                </li>
                                <li className="flex gap-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                    <p><strong>Deterministic Responses:</strong> LLMs are forced to output structured UI components via Strict JSON schemas, rendering interactive cards instead of markdown walls.</p>
                                </li>
                                <li className="flex gap-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                    <p><strong>Voice Pipeline:</strong> High-efficiency parallel pipeline routing raw audio through Whisper STT, processing the agent loop, and chunk-streaming TTS audio back instantly.</p>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6">Technical Stack</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Frontend</p>
                                    <p className="font-mono text-sm text-blue-200">React, TailwindCSS, Zustand, Framer Motion</p>
                                </div>
                                <div className="h-px w-full bg-slate-700" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Backend & Infra</p>
                                    <p className="font-mono text-sm text-emerald-200">Node.js, Express, Socket.io, Redis, DigitalOcean</p>
                                </div>
                                <div className="h-px w-full bg-slate-700" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI & Services</p>
                                    <p className="font-mono text-sm text-purple-200">OpenAI Agent SDK, Whisper API, Razorpay</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Performance, Security & Resilience (Expanded) */}
            <section className="py-16 lg:py-20 px-4 sm:px-6 bg-[#fdfbf7]">
                <div className="max-w-6xl mx-auto mb-12 text-center">
                    <h2 className="text-3xl font-bold text-slate-900">Security & System Resilience</h2>
                    <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
                        Enterprise-grade protections ensuring high availability, defending against prompt injections, and strictly managing state.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {/* Performance / Rate Limiting */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                        <Zap className="w-10 h-10 text-emerald-500 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Traffic & Rate Limiting</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> <strong>Redis Rate Limiting:</strong> Dynamic TPS tracking to prevent DDoS & API abuse on TTS/Chat endpoints.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> <strong>Graceful Fallback:</strong> Reverts to IP tracking if the cache layer goes offline.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> <strong>Session Caching:</strong> Sub-10ms latency for conversational history via Redis Hashes.</li>
                        </ul>
                    </div>

                    {/* Agent Security & Prompt Injection */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
                        <ShieldCheck className="w-10 h-10 text-rose-500 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-4">AI Guardrails</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> <strong>Prompt Injection Defense:</strong> Pre-flight regex validators intercept malicious "ignore instructions" jailbreaks before LLM processing.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> <strong>Strict Action Boundaries:</strong> Tool definitions prohibit AI from directly interacting with standard databases without service layer validation.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> <strong>Trace Logging:</strong> Every agent evaluation is permanently persisted for auditability.</li>
                        </ul>
                    </div>

                    {/* Cryptography & Auth */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <Lock className="w-10 h-10 text-blue-500 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Cryptography & Access Control</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> <strong>JWT Authorization:</strong> Secured via HttpOnly cookies and strictly whitelisted CORS origins.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> <strong>Role-Based Access (RBAC):</strong> Discrete middleware prevents customer tokens from accessing the Admin/Pharmacist orchestrator.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> <strong>Data Sanitization:</strong> Bcrypt password hashing and Mongoose strict schema enforcement.</li>
                        </ul>
                    </div>

                    {/* Webhooks & Asynchronous Processing */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
                        <Share2 className="w-10 h-10 text-purple-500 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Webhook & Event Architecture</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" /> <strong>HMAC-SHA256 Signatures:</strong> All Razorpay webhooks are cryptographically verified to prevent payload spoofing.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" /> <strong>Idempotent Operations:</strong> Prevents double-charging or duplicate fulfillment if webhook retries occur.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" /> <strong>Async Notifications:</strong> Offloads WhatsApp messaging, Email transmission, and PDF Invoice generation to non-blocking background threads.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 8. Codebase Transparency Section */}
            <section className="pt-12 pb-32 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center bg-white p-10 md:p-16 rounded-[3rem] border-2 border-primary/20 shadow-2xl shadow-primary/10">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileJson className="w-10 h-10 text-primary" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
                        🔍 Codebase Transparency & Verifiability
                    </h2>

                    <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                        All features shown in this demo are fully implemented natively in the codebase. <strong className="text-slate-900">Nothing is mocked or hardcoded.</strong>
                        <br /><br />
                        Evaluators are highly encouraged to inspect our GitHub repository to verify the Agent orchestration layers, Razorpay integration, Redis caching loops, and strictly typed React architectures.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="https://github.com/atharva038/HackFusion-2k26-Team-LUXRAY-" target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors">
                            <Code2 className="w-5 h-5" />
                            Review GitHub Repository
                        </a>
                        <a href="/login"
                            className="flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                            Enter Platform App
                            <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProjectShowcase;
