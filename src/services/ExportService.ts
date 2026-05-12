import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Account, Ledger, TransactionWithProduct } from '../types/database';

export const ExportService = {
  /**
   * Exports data to Excel file
   */
  exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  },

  /**
   * Exports account list to Excel
   */
  exportAccountsToExcel(accounts: Account[]) {
    const data = accounts.map(a => ({
      'Cari Adı': a.name,
      'Tür': a.type === 'customer' ? 'Müşteri' : 'Tedarikçi',
      'Entity Türü': a.entity_type === 'corporate' ? 'Tüzel Kişi' : 'Gerçek Kişi',
      'Para Birimi': a.currency || 'TRY',
      'Bakiye': a.balance,
      'İletişim': a.contact_info || '-'
    }));
    this.exportToExcel(data, 'Cari_Hesaplar', 'Cariler');
  },

  /**
   * Exports ledger history (E-Defter) to Excel
   */
  exportLedgerToExcel(history: Ledger[], accountName: string) {
    const data = history.map(h => ({
      'Tarih': new Date(h.created_at || '').toLocaleString('tr-TR'),
      'Açıklama': h.description,
      'Tür': h.type === 'debt' ? 'Borç' : 'Alacak',
      'Para Birimi': h.currency || 'TRY',
      'Tutar': h.amount,
      'Durum': h.is_voided ? 'İptal Edildi' : 'Aktif'
    }));
    this.exportToExcel(data, `${accountName}_Ekstre`, 'Ekstre');
  },

  /**
   * Exports ledger history (E-Defter) to PDF
   */
  exportLedgerToPDF(history: Ledger[], accountName: string) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.text(`${accountName} - Hesap Ekstresi`, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Oluşturma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 14, 30);

    const tableData = history.map(h => [
      new Date(h.created_at || '').toLocaleString('tr-TR'),
      h.description || '-',
      h.type === 'debt' ? 'Borç' : 'Alacak',
      new Intl.NumberFormat('tr-TR', { style: 'currency', currency: h.currency || 'TRY' }).format(h.amount),
      h.is_voided ? 'İptal' : 'Aktif'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Tarih', 'Açıklama', 'Tür', 'Tutar', 'Durum']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 8 }
    });

    doc.save(`${accountName}_Ekstre.pdf`);
  }
};
