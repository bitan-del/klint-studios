import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '../services/supabaseClient';

/**
 * Generate and download a GST invoice PDF
 */
export const generateInvoice = async (paymentId: string, userEmail: string): Promise<void> => {
  try {
    // Fetch invoice data from Supabase
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        payment:payments(*)
      `)
      .eq('payment_id', paymentId)
      .single();

    if (error || !invoice) {
      console.error('Invoice fetch error:', error);
      throw new Error('Invoice not found. It may take a few moments to generate.');
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', pageWidth / 2, 20, { align: 'center' });

    // Company Details (Left)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Klint Studios', 20, 40);
    doc.setFont('helvetica', 'normal');
    doc.text('GST: 29XXXXX1234X1ZX', 20, 46);
    doc.text('Address Line 1', 20, 52);
    doc.text('City, State - 000000', 20, 58);

    // Invoice Details (Right)
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 20, 40, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${format(new Date(invoice.created_at), 'dd MMM yyyy')}`, pageWidth - 20, 46, { align: 'right' });
    doc.text(`Payment ID: ${paymentId.substring(0, 16)}...`, pageWidth - 20, 52, { align: 'right' });

    // Customer Details
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(userEmail, 20, 81);
    if (invoice.gst_number) {
      doc.text(`GST: ${invoice.gst_number}`, 20, 87);
    }

    // Items Table
    const tableStartY = invoice.gst_number ? 100 : 95;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Period', 'Amount (₹)']],
      body: [
        [
          `${invoice.plan.charAt(0).toUpperCase() + invoice.plan.slice(1)} Plan`,
          '1 Year',
          invoice.base_amount.toFixed(2),
        ],
        [
          'GST (18%)',
          '',
          invoice.gst_amount.toFixed(2),
        ],
      ],
      foot: [
        ['', 'Total Amount', `₹${invoice.total_amount.toFixed(2)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });

    // Payment Info
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information:', 20, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Method: ${invoice.payment.payment_method || 'Razorpay'}`, 20, finalY + 6);
    doc.text(`Status: ${invoice.payment.status.toUpperCase()}`, 20, finalY + 12);
    doc.text(`Transaction ID: ${invoice.payment.razorpay_payment_id}`, 20, finalY + 18);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'This is a computer-generated invoice and does not require a signature.',
      pageWidth / 2,
      doc.internal.pageSize.height - 20,
      { align: 'center' }
    );
    doc.text(
      '© Klint Studios - All rights reserved',
      pageWidth / 2,
      doc.internal.pageSize.height - 15,
      { align: 'center' }
    );

    // Save PDF
    const fileName = `Klint-Studios-Invoice-${invoice.invoice_number}.pdf`;
    doc.save(fileName);

    console.log('✅ Invoice generated:', fileName);
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    throw error;
  }
};




