import React from 'react';
import DataTable from './DataTable';
import DataCards from './DataCards';
import OrderSummaryCard from './OrderSummaryCard';
import InvoiceSummaryCard from './InvoiceSummaryCard';

/**
 * useIsMobile — returns true when viewport width <= 768px.
 * Uses matchMedia for efficiency.
 */
const useIsMobile = () => {
    const [mobile, setMobile] = React.useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        const handler = (e) => setMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return mobile;
};

// List-type structured outputs that use table / card rendering
const LIST_TYPES = new Set(['order_list', 'medicine_list', 'inventory_list', 'refill_list']);

/**
 * StructuredRenderer — dispatches structured AI response data to the right UI component.
 *
 * Props:
 *   structured: { type, title, items?, columns?, columnLabels?, ...rest }
 *
 * Renders nothing if structured is null/undefined.
 */
const StructuredRenderer = ({ structured, messageId }) => {
    const isMobile = useIsMobile();

    if (!structured) return null;

    const { type, title, items, columns, columnLabels } = structured;

    // ── Single order summary ──────────────────────────────────────────────
    if (type === 'order_summary') {
        return (
            <div className="mt-2">
                <OrderSummaryCard
                    messageId={messageId}
                    orderId={structured.orderId}
                    status={structured.status}
                    items={structured.items}
                    total={structured.total}
                    customer={structured.customer}
                    razorpayOrderId={structured.razorpayOrderId}
                    amount={structured.amount}
                />
            </div>
        );
    }

    // ── Invoice summary ───────────────────────────────────────────────────
    if (type === 'invoice_summary') {
        return (
            <div className="mt-2 text-text">
                <InvoiceSummaryCard
                    invoiceId={structured.invoiceId}
                    orderId={structured.orderId}
                    amountPaid={structured.amountPaid}
                    items={structured.items}
                />
            </div>
        );
    }

    // ── List types ────────────────────────────────────────────────────────
    if (LIST_TYPES.has(type)) {
        if (!items || items.length === 0) return null;

        return (
            <div className="mt-3 w-full">
                {/* Title bar */}
                {title && (
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2 ml-1">
                        {title} · {items.length} result{items.length !== 1 ? 's' : ''}
                    </p>
                )}

                {/* Table on desktop, cards on mobile */}
                {isMobile ? (
                    <DataCards columns={columns} columnLabels={columnLabels} items={items} />
                ) : (
                    <DataTable columns={columns} columnLabels={columnLabels} items={items} />
                )}
            </div>
        );
    }

    // Unknown type — render nothing, fall back to plain text
    return null;
};

export default StructuredRenderer;
