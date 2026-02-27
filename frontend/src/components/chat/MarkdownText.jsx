import React from 'react';

/**
 * MarkdownText — lightweight safe markdown renderer for chat bubbles.
 *
 * Supports:
 *   **bold**, *italic*, `inline code`, # headings,
 *   - bullet lists, 1. numbered lists, > blockquotes, ---
 *
 * No external dependencies. No HTML injection risk.
 */

const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inlineFormat = (text) => {
    // Process inline markdown: bold, italic, inline code
    const parts = [];
    // Split on **, *, ` — in priority order
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) {
            parts.push(<span key={last}>{text.slice(last, match.index)}</span>);
        }

        if (match[2]) {
            // **bold**
            parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>);
        } else if (match[3]) {
            // *italic*
            parts.push(<em key={match.index} className="italic">{match[3]}</em>);
        } else if (match[4]) {
            // `code`
            parts.push(
                <code key={match.index} className="font-mono text-[.9em] bg-black/8 dark:bg-white/8 px-1.5 py-0.5 rounded-md">
                    {match[4]}
                </code>
            );
        }

        last = match.index + match[0].length;
    }

    if (last < text.length) {
        parts.push(<span key={last}>{text.slice(last)}</span>);
    }

    return parts.length > 0 ? parts : text;
};

const MarkdownText = ({ text }) => {
    if (!text) return null;

    const rawLines = text.split('\n');
    const elements = [];
    let i = 0;
    let key = 0;

    while (i < rawLines.length) {
        const line = rawLines[i];

        // ── Horizontal rule ──────────────────────────────────────────────
        if (/^---+$/.test(line.trim())) {
            elements.push(<hr key={key++} className="my-3 border-black/10 dark:border-white/10" />);
            i++;
            continue;
        }

        // ── Headings ─────────────────────────────────────────────────────
        const h3 = line.match(/^###\s+(.+)/);
        const h2 = line.match(/^##\s+(.+)/);
        const h1 = line.match(/^#\s+(.+)/);
        if (h1) {
            elements.push(<p key={key++} className="font-bold text-[15px] text-text mt-3 mb-1">{inlineFormat(h1[1])}</p>);
            i++; continue;
        }
        if (h2) {
            elements.push(<p key={key++} className="font-semibold text-[14px] text-text mt-2 mb-0.5">{inlineFormat(h2[1])}</p>);
            i++; continue;
        }
        if (h3) {
            elements.push(<p key={key++} className="font-semibold text-[13px] text-text-muted mt-2 mb-0.5 uppercase tracking-wide">{inlineFormat(h3[1])}</p>);
            i++; continue;
        }

        // ── Blockquote ───────────────────────────────────────────────────
        const bq = line.match(/^>\s*(.*)/);
        if (bq) {
            elements.push(
                <div key={key++} className="border-l-2 border-primary/40 pl-3 my-1 text-text-muted italic text-[13.5px]">
                    {inlineFormat(bq[1])}
                </div>
            );
            i++; continue;
        }

        // ── Bullet list ──────────────────────────────────────────────────
        if (/^[-*•]\s/.test(line)) {
            const items = [];
            while (i < rawLines.length && /^[-*•]\s/.test(rawLines[i])) {
                items.push(rawLines[i].replace(/^[-*•]\s+/, ''));
                i++;
            }
            elements.push(
                <ul key={key++} className="my-1.5 space-y-0.5 list-none">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[14px]">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                            <span>{inlineFormat(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // ── Numbered list ────────────────────────────────────────────────
        if (/^\d+\.\s/.test(line)) {
            const items = [];
            let num = 1;
            while (i < rawLines.length && /^\d+\.\s/.test(rawLines[i])) {
                items.push({ n: num++, text: rawLines[i].replace(/^\d+\.\s+/, '') });
                i++;
            }
            elements.push(
                <ol key={key++} className="my-1.5 space-y-0.5 list-none">
                    {items.map((item) => (
                        <li key={item.n} className="flex items-start gap-2.5 text-[14px]">
                            <span className="shrink-0 text-[11px] font-bold text-primary/70 mt-0.5 min-w-[16px] text-right">{item.n}.</span>
                            <span>{inlineFormat(item.text)}</span>
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // ── Empty line → spacing ─────────────────────────────────────────
        if (line.trim() === '') {
            // Only add space if next line isn't also blank
            if (i + 1 < rawLines.length && rawLines[i + 1].trim() !== '') {
                elements.push(<div key={key++} className="h-1.5" />);
            }
            i++;
            continue;
        }

        // ── Regular paragraph ────────────────────────────────────────────
        elements.push(
            <p key={key++} className="text-[14.5px] leading-relaxed">
                {inlineFormat(line)}
            </p>
        );
        i++;
    }

    return <div className="space-y-0.5">{elements}</div>;
};

export default MarkdownText;
