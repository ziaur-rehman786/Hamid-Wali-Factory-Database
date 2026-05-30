import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { loadLogoBase64, getLogoUrlFromFactory } from './logoLoader.js';
import { formatCurrency } from './format.js';

export const generateInvoicePDF = async (invoice) => {
  const doc = new jsPDF();
  const factory = invoice.factory || {};
  const pageWidth = doc.internal.pageSize.getWidth();

  const logoUrl = getLogoUrlFromFactory(factory);
  let startY = 20;

  try {
    const logoData = await loadLogoBase64(logoUrl);
    doc.addImage(logoData, 'PNG', pageWidth / 2 - 18, 8, 36, 36);
    startY = 50;
  } catch {
    startY = 20;
  }

  doc.setTextColor(0, 31, 63);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(factory.factory_name || 'Hamid Wali Shoe Factory', pageWidth / 2, startY, { align: 'center' });

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(factory.factory_address || 'Peshawar, Pakistan', pageWidth / 2, startY + 7, { align: 'center' });
  let contactY = startY + 13;
  doc.text(`Phone: ${factory.factory_phone || ''}`, pageWidth / 2, contactY, { align: 'center' });
  if (factory.factory_email) {
    contactY += 6;
    doc.text(`Email: ${factory.factory_email}`, pageWidth / 2, contactY, { align: 'center' });
  }

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(14, contactY + 8, pageWidth - 14, contactY + 8);

  const detailsY = contactY + 18;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(`Invoice No: ${invoice.invoice_number}`, 14, detailsY);
  doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-GB')}`, 14, detailsY + 7);
  doc.text(`Customer: ${invoice.customer_name}`, 14, detailsY + 14);

  const tableData = (invoice.items || []).map((item) => [
    item.art_number,
    item.color_name,
    item.size_value,
    item.cartons != null && item.cartons > 0 ? String(item.cartons) : '—',
    String(item.quantity),
    formatCurrency(item.sale_price),
    formatCurrency(item.item_total),
  ]);

  doc.autoTable({
    startY: detailsY + 22,
    head: [['Design', 'Color', 'Size', 'Cartons', 'Pairs', 'Price (AFN)', 'Total (AFN)']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 31, 63], textColor: [212, 175, 55] },
    styles: { fontSize: 10 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: ${formatCurrency(invoice.grand_total)}`, pageWidth - 14, finalY, {
    align: 'right',
  });
  doc.text(`Paid Amount: ${formatCurrency(invoice.paid_amount)}`, pageWidth - 14, finalY + 8, {
    align: 'right',
  });
  doc.setTextColor(200, 0, 0);
  doc.text(`Remaining: ${formatCurrency(invoice.remaining_amount)}`, pageWidth - 14, finalY + 16, {
    align: 'right',
  });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, finalY + 35, { align: 'center' });

  return doc;
};

export const downloadInvoicePDF = async (invoice) => {
  const doc = await generateInvoicePDF(invoice);
  doc.save(`${invoice.invoice_number}.pdf`);
};

export const printInvoice = async (invoice) => {
  const doc = await generateInvoicePDF(invoice);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

/** PDF from on-screen bill so Pashto renders correctly */
export const downloadInvoicePDFFromElement = async (elementId, filename) => {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Invoice element not found');

  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  let imgHeight = (canvas.height * contentWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(`${filename}.pdf`);
};
