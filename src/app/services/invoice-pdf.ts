import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class InvoicePdfService {

  /** Builds the jsPDF document and returns it along with the invoice number. */
  private buildPdf(order: any): { doc: jsPDF; invoiceNumber: string } {
    const doc = new jsPDF();
    // Reuse stored invoice number if available, otherwise generate a new one
    const invoiceNumber = order.invoice?.invoiceNumber || `INV-${Date.now()}`;
    const date = order.invoice?.invoiceDate
      ? new Date(order.invoice.invoiceDate.seconds
          ? order.invoice.invoiceDate.seconds * 1000
          : order.invoice.invoiceDate).toLocaleDateString()
      : new Date().toLocaleDateString();

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Cap Stylist', 14, 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Cap Distribution Invoice', 14, 26);
    doc.text('Retailer Cap Delivery & Store Order System', 14, 32);

    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', 14, 48);

    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoiceNumber}`, 14, 56);
    doc.text(`Date: ${date}`, 14, 64);
    doc.text(`Status: ${order.status || 'Delivered'}`, 14, 72);

    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', 120, 48);

    doc.setFont('helvetica', 'normal');
    doc.text(`Store: ${order.storeName || ''}`, 120, 56);
    doc.text(`Owner: ${order.ownerName || ''}`, 120, 64);
    doc.text(`Phone: ${order.phone || ''}`, 120, 72);
    doc.text(`Email: ${order.email || 'N/A'}`, 120, 80);

    const address = order.storeAddress || '';
    doc.text(`Address: ${address}`, 120, 88, { maxWidth: 75 });

    autoTable(doc, {
      startY: 104,
      head: [['New Order Item', 'Qty', 'Price', 'Total']],
      body: (order.newItems || []).map((item: any) => [
        item.name,
        item.quantity,
        `$${Number(item.price).toFixed(2)}`,
        `$${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
      ])
    });

    let y = (doc as any).lastAutoTable.finalY + 12;

    autoTable(doc, {
      startY: y,
      head: [['Returned Item', 'Qty', 'Credit']],
      body: (order.returnItems || []).map((item: any) => [
        item.name,
        item.quantity,
        `-$${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
      ])
    });

    y = (doc as any).lastAutoTable.finalY + 14;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', 14, y);

    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${order.invoice?.paymentMethod || 'N/A'}`, 14, y + 8);

    if (order.invoice?.paymentMethod === 'Check') {
      doc.text(`Check Number: ${order.invoice?.checkNumber || ''}`, 14, y + 16);
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`New Order Total: $${Number(order.orderTotal || 0).toFixed(2)}`, 120, y);
    doc.text(`Return Credit: -$${Number(order.returnTotal || 0).toFixed(2)}`, 120, y + 8);
    doc.text(`Final Amount Due: $${Number(order.finalAmount || 0).toFixed(2)}`, 120, y + 18);

    if (order.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', 14, y + 34);

      doc.setFont('helvetica', 'normal');
      doc.text(order.notes, 14, y + 42, { maxWidth: 180 });
    }

    doc.setFontSize(10);
    doc.text('Thank you for your business!', 14, 285);

    return { doc, invoiceNumber };
  }

  /** Generates the invoice PDF and triggers a browser download. */
  generateInvoice(order: any): void {
    const { doc, invoiceNumber } = this.buildPdf(order);
    doc.save(`${invoiceNumber}.pdf`);
  }

  /**
   * Generates the invoice PDF and returns it as a base64 data URI string
   * along with the invoice number — used for emailing the PDF.
   */
  generateInvoiceBase64(order: any): { base64: string; invoiceNumber: string } {
    const { doc, invoiceNumber } = this.buildPdf(order);
    const base64 = doc.output('datauristring'); // "data:application/pdf;base64,..."
    return { base64, invoiceNumber };
  }
}
