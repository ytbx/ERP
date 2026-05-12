import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TransactionWithProduct } from '../types/database';

export const DocumentService = {
  generateInvoice(transaction: TransactionWithProduct) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Financial calculations
    const unitPrice = transaction.unit_price || 0;
    const vatRate = transaction.vat_rate || 20;
    const isVatIncluded = transaction.vat_included || false;
    const qty = transaction.quantity;

    let subtotal, vatAmount, total;

    if (isVatIncluded) {
      total = qty * unitPrice;
      subtotal = total / (1 + vatRate / 100);
      vatAmount = total - subtotal;
    } else {
      subtotal = qty * unitPrice;
      vatAmount = subtotal * (vatRate / 100);
      total = subtotal + vatAmount;
    }

    const formatCurrency = (amt: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: transaction.currency || 'TRY' }).format(amt);

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text('ERP SISTEMI - FATURA', pageWidth / 2, 20, { align: 'center' });

    // Company Info
    doc.setFontSize(10);
    doc.text('Antigravity ERP Yazilim Ltd. Sti.', 14, 35);
    doc.text('Maslak, Istanbul', 14, 40);
    doc.text('Vergi No: 1234567890', 14, 45);

    // Invoice Info
    doc.text(`Tarih: ${new Date(transaction.created_at || '').toLocaleString('tr-TR')}`, pageWidth - 14, 35, { align: 'right' });
    doc.text(`Belge No: INV-${transaction.id.slice(0, 8).toUpperCase()}`, pageWidth - 14, 40, { align: 'right' });
    doc.text(`Tip: ${transaction.type === 'out' ? 'Satis' : 'Alis'}`, pageWidth - 14, 45, { align: 'right' });

    // Client/Account Info
    doc.setFontSize(12);
    doc.text('Cari Bilgileri:', 14, 60);
    doc.setFontSize(10);
    doc.text(transaction.accounts?.name || 'Genel Musteri', 14, 65);

    // Table
    const tableData = [
      [
        transaction.products?.name || 'Urun',
        transaction.products?.sku || '-',
        qty.toString(),
        formatCurrency(unitPrice),
        `%${vatRate}`,
        formatCurrency(total)
      ]
    ];

    autoTable(doc, {
      startY: 75,
      head: [['Urun Adi', 'SKU', 'Miktar', 'Birim Fiyat', 'KDV', 'Toplam']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      margin: { top: 75 }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    const summaryX = pageWidth - 14;
    
    doc.setFontSize(10);
    doc.text(`Ara Toplam: ${formatCurrency(subtotal)}`, summaryX, finalY + 10, { align: 'right' });
    if (vatRate === 0 && (transaction as any).tax_exemption_code) {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`KDV İstisna: ${(transaction as any).tax_exemption_code} - ${(transaction as any).tax_exemption_reason || ''}`, summaryX, finalY + 15, { align: 'right' });
      doc.setTextColor(40);
      doc.setFontSize(10);
    } else {
      doc.text(`KDV Tutari (%${vatRate}): ${formatCurrency(vatAmount)}`, summaryX, finalY + 15, { align: 'right' });
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`GENEL TOPLAM: ${formatCurrency(total)}`, summaryX, finalY + 25, { align: 'right' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Is bu belge elektronik ortamda olusturulmustur.', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

    // Save
    doc.save(`Fatura-${transaction.id.slice(0, 8)}.pdf`);
  },

  generateDispatchNote(transaction: TransactionWithProduct) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text('SEVK IRSALIYESI', pageWidth / 2, 20, { align: 'center' });

    // Company Info
    doc.setFontSize(10);
    doc.text('Antigravity ERP Yazilim Ltd. Sti.', 14, 35);
    doc.text('Maslak, Istanbul', 14, 40);

    // Document Info
    doc.text(`Tarih: ${new Date(transaction.created_at || '').toLocaleString('tr-TR')}`, pageWidth - 14, 35, { align: 'right' });
    doc.text(`Irsaliye No: DLV-${transaction.id.slice(0, 8).toUpperCase()}`, pageWidth - 14, 40, { align: 'right' });

    // Client Info
    doc.setFontSize(12);
    doc.text('Alici Bilgileri:', 14, 60);
    doc.setFontSize(10);
    doc.text(transaction.accounts?.name || 'Genel Musteri', 14, 65);

    // Table (Prices hidden in Dispatch Note usually, or optional)
    const tableData = [
      [
        transaction.products?.name || 'Urun',
        transaction.products?.sku || '-',
        transaction.quantity.toString(),
        'ADET'
      ]
    ];

    autoTable(doc, {
      startY: 75,
      head: [['Urun Adi', 'SKU', 'Miktar', 'Birim']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [75, 75, 75] },
      margin: { top: 75 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 85;

    // Signatures
    doc.text('Teslim Eden', 40, finalY + 30);
    doc.text('Teslim Alan', pageWidth - 70, finalY + 30);
    
    doc.setDrawColor(200);
    doc.line(20, finalY + 50, 80, finalY + 50);
    doc.line(pageWidth - 90, finalY + 50, pageWidth - 30, finalY + 50);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Is bu belge sevk irsaliyesi yerine gecer.', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

    // Save
    doc.save(`Irsaliye-${transaction.id.slice(0, 8)}.pdf`);
  }
};
