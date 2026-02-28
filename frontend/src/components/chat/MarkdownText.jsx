import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Link } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

/**
 * MarkdownText — robust markdown renderer using ReactMarkdown.
 *
 * Supports GFM (tables, strikethrough, autolink), raw HTML (like <u> for underline),
 * and maps elements to standard Tailwind styles matching the app's dark/light aesthetic.
 */
const MarkdownText = ({ text }) => {
    if (!text) return null;

    // AI sometimes bunches numbered lists on one line like "details: 1. Item 2. Item".
    // We forcefully insert a newline before numbers that look like list items
    // (space followed by a number, a dot, and a space) if they don't already follow a newline.
    const preprocessedText = text.replace(/([^\n]) (\d+\.\s)/g, '$1\n\n$2');

    return (
        <div className="space-y-4">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    h1: ({ ...props }) => <h1 className="font-bold text-xl text-text mt-5 mb-2" {...props} />,
                    h2: ({ ...props }) => <h2 className="font-semibold text-lg text-text mt-4 mb-1.5" {...props} />,
                    h3: ({ ...props }) => <h3 className="font-semibold text-[15px] text-text-muted mt-3 mb-1 uppercase tracking-wide" {...props} />,
                    p: ({ ...props }) => <p className="text-[14.5px] leading-relaxed" {...props} />,
                    ul: ({ ...props }) => <ul className="my-2.5 ml-5 space-y-1 list-disc marker:text-primary/60" {...props} />,
                    ol: ({ ...props }) => <ol className="my-2.5 ml-5 space-y-1 list-decimal marker:text-primary/80 marker:font-semibold" {...props} />,
                    li: ({ ...props }) => <li className="pl-1 text-[14px] leading-relaxed" {...props} />,
                    strong: ({ ...props }) => <strong className="font-semibold text-text" {...props} />,
                    em: ({ ...props }) => <em className="italic" {...props} />,
                    code: ({ inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return inline ? (
                            <code className="font-mono text-[.9em] bg-black/8 dark:bg-white/8 px-1.5 py-0.5 rounded-md text-primary" {...props}>
                                {children}
                            </code>
                        ) : (
                            <div className="my-3 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-[#1e1e1e]">
                                {match && (
                                    <div className="flex px-3 py-1.5 bg-[#2d2d2d] text-white/70 text-xs font-mono border-b border-white/10 uppercase">
                                        {match[1]}
                                    </div>
                                )}
                                <div className="overflow-x-auto p-4">
                                    <pre className="text-[13px] leading-snug font-mono text-white/90">
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                </div>
                            </div>
                        );
                    },
                    blockquote: ({ ...props }) => (
                        <blockquote className="border-l-2 border-primary/50 pl-3.5 my-2.5 text-text-muted italic text-[14px] bg-primary/5 py-1.5 rounded-r-lg" {...props} />
                    ),
                    hr: ({ ...props }) => <hr className="my-5 border-black/10 dark:border-white/10" {...props} />,
                    table: ({ ...props }) => (
                        <div className="overflow-x-auto my-4 rounded-xl border border-black/10 dark:border-white/10 shadow-sm bg-black/[0.02] dark:bg-white/[0.02]">
                            <table className="w-full text-left text-[14px] border-collapse" {...props} />
                        </div>
                    ),
                    thead: ({ ...props }) => <thead className="bg-black/5 dark:bg-white/5 text-text font-semibold border-b border-black/10 dark:border-white/10" {...props} />,
                    tbody: ({ ...props }) => <tbody className="divide-y divide-black/5 dark:divide-white/5" {...props} />,
                    tr: ({ ...props }) => <tr className="hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors" {...props} />,
                    th: ({ ...props }) => <th className="px-4 py-2.5 whitespace-nowrap" {...props} />,
                    td: ({ ...props }) => <td className="px-4 py-2.5 text-text-muted leading-relaxed" {...props} />,
                    // Custom handling for <u> and <ins> tags if they appear in HTML
                    u: ({ ...props }) => <u className="underline decoration-primary/60 underline-offset-2 font-medium" {...props} />,
                    ins: ({ ...props }) => <ins className="underline decoration-primary/60 underline-offset-2 font-medium no-underline" {...props} />,
                    a: ({ href, children, ...props }) => {
                        // If it's a specific routing link to orders or prescriptions, use the Slide-Over to maintain chat context
                        if (href === '/my-orders' || href === '/my-prescriptions') {
                            const slideOverType = href.replace('/', '');
                            return (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        useAppStore.getState().setActiveSlideOver(slideOverType);
                                    }}
                                    className="inline-flex items-center justify-center px-4 py-1.5 mt-2 bg-cyan-600 text-white text-[14px] font-medium rounded-xl shadow-soft hover:bg-cyan-500 active:scale-95 transition-all no-underline"
                                >
                                    {children} <span className="ml-1.5 opacity-80 text-[16px] leading-none">→</span>
                                </button>
                            );
                        }

                        // For other local routes
                        if (href && href.startsWith('/')) {
                            return (
                                <Link
                                    to={href}
                                    className="inline-flex items-center justify-center px-4 py-1.5 mt-2 bg-primary text-white text-[14px] font-medium rounded-xl shadow-soft hover:bg-primary/90 active:scale-95 transition-all no-underline"
                                >
                                    {children} <span className="ml-1.5 opacity-80 text-[16px] leading-none">→</span>
                                </Link>
                            );
                        }
                        // Default external link styling
                        return (
                            <a
                                href={href}
                                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors font-medium"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                            >
                                {children}
                            </a>
                        );
                    }
                }}
            >
                {preprocessedText}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownText;
