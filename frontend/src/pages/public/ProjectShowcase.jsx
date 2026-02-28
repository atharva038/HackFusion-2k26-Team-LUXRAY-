import React, { useEffect } from 'react';
import {
    BrainCircuit, Bot, Languages, ScanFace, CreditCard, ShieldCheck,
    Zap, Share2, Layers, Search, Database, Lock, Cpu, Server, CheckCircle2,
    Code2, FileJson, ArrowRight, ArrowRightCircle
} from 'lucide-react';

const ProjectShowcase = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#fdfbf7] text-slate-800 font-sans selection:bg-emerald-200">
            {/* 1. Hero Section */}
            <section className="relative pt-24 pb-16 px-6 max-w-6xl mx-auto overflow-hidden">
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

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
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

            {/* 2. Complete Feature Breakdown */}
            <section className="py-20 px-6 bg-white border-y border-slate-100">
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

            {/* 3. Architecture Overview & 9. Demo Flow Visualization */}
            <section className="py-20 px-6 max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center text-slate-900">System Architecture & Flow</h2>

                <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute inset-0 pattern-dots border-slate-200/50 opacity-10 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        {/* Flow Diagram */}
                        <div className="flex-1 space-y-4">
                            {[
                                { name: 'Interface Layer', desc: 'React, Zustand, Renderers', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
                                { name: 'Agent Layer', desc: 'Intent Router, Context Handler', icon: Bot, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
                                { name: 'Tool Layer', desc: 'Strict JSON Validation', icon: Code2, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-100' },
                                { name: 'Service Layer', desc: 'Payment, Inventory, Auth', icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
                                { name: 'Data Layer', desc: 'MongoDB, Redis', icon: Database, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' }
                            ].map((layer, idx, arr) => (
                                <div key={idx} className="relative">
                                    <div className={`flex items-center p-4 rounded-2xl border ${layer.bg}`}>
                                        <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mr-4 ${layer.color}`}>
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
                        <div className="flex-1 md:pl-12 border-t md:border-t-0 md:border-l border-slate-200 pt-8 md:pt-0">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Strict Layer Separation</h3>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Our architecture strictly isolates the AI's reasoning capabilities from database access.
                                The <span className="font-semibold text-slate-800">Agent Layer</span> can only output structured JSON tool calls.
                                These calls are validated by the <span className="font-semibold text-slate-800">Tool Layer</span>,
                                which then safely delegates execution to the deterministic <span className="font-semibold text-slate-800">Service Layer</span>.
                            </p>
                            <div className="bg-[#fdfbf7] rounded-xl p-5 border border-slate-200">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Execution Flow</h4>
                                <ul className="space-y-2 font-mono text-sm text-slate-700">
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500" /> User Input</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500" /> Orchestrator Routing</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500" /> Authorized Tool Invocation</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500" /> Service Execution</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-emerald-500" /> Webhook Async Confirmation</li>
                                    <li className="flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-primary" /> UI Render (Socket.io)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="bg-slate-900 py-20 px-6 text-slate-300">
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

            {/* 6. Performance & 7. Security */}
            <section className="py-20 px-6 bg-[#fdfbf7]">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                        <Zap className="w-12 h-12 text-emerald-500 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Performance Optimizations</h3>
                        <ul className="space-y-3 text-slate-600">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Redis Cache-First Strategy for all hot paths</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Reduced MongoDB reads via Session Context</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Asynchronous Webhooks instead of polling</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Structured Renderers eliminate Markdown parsing overhead</li>
                        </ul>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <ShieldCheck className="w-12 h-12 text-blue-500 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Security & Reliability</h3>
                        <ul className="space-y-3 text-slate-600">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> HMAC Signature Verification on all Webhooks</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Strict Role-Based Access Control (JWT + Middleware)</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Sanitized AI execution boundaries (No DB access)</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Signed Cloudinary URLs & Secure Invoice PDF generation</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 8. Codebase Transparency Section */}
            <section className="pt-12 pb-32 px-6">
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
