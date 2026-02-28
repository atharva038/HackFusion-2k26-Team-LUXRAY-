const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Download a professional PDF invoice from the backend.
 * The backend generates the same PDF that is also emailed to the customer,
 * ensuring a single source of truth for invoice formatting.
 *
 * @param {string} invoiceId  - The invoice ID (e.g. "INV-722332524")
 * @param {string} token      - JWT auth token (from useAuthStore)
 */
export const downloadInvoicePdf = async (invoiceId, token) => {
    if (!invoiceId) {
        console.error("[Invoice] Cannot download — invoiceId is missing.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/invoice/${invoiceId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error("[Invoice] Download failed:", err.error || res.statusText);
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Invoice-${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("[Invoice] Download error:", err.message);
    }
};
