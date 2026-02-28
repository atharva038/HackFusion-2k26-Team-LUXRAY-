import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadInvoicePdf = ({ invoiceId, orderId, amountPaid, items }) => {
    // 1. Initialize PDF
    const doc = new jsPDF();

    // 2. Add Header / Branding
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Primary Blue
    doc.text('NexusMed AI Pharmacy', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Your Autonomous Healthcare Assistant', 14, 28);

    // 3. Add Invoice Metadata
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Payment Receipt', 14, 45);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Invoice No: ${invoiceId}`, 14, 55);
    doc.text(`Order ID: ${orderId}`, 14, 62);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 69);
    doc.text(`Status: Paid`, 14, 76);

    // 4. Transform Items String into array if needed, or just display the string
    // Usually the bot returns something like "Amlodipine 5mg, Paracetamol"
    const itemList = items ? items.split(',').map(i => [i.trim(), '1']) : [['Medicine Items', '1']];

    // 5. Add Table for Items
    autoTable(doc, {
        startY: 90,
        head: [['Item Description', 'Quantity']],
        body: itemList,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10, cellPadding: 5 },
    });

    // 6. Add Total Block
    const finalY = doc.lastAutoTable.finalY || 90;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Amount Paid: INR ${amountPaid}`, 14, finalY + 15);

    // 7. Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for trusting NexusMed AI!', 14, finalY + 35);

    // 8. Save PDF triggering browser download
    doc.save(`Invoice_${invoiceId}.pdf`);
};
