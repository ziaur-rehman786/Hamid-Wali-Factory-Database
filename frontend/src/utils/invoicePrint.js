/** Open a clean print window (about:blank) so the browser does not show the app URL in print headers. */
export function printInvoiceFromElement(elementId = 'invoice-print', documentTitle = 'Invoice') {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Invoice element not found');

  const clone = el.cloneNode(true);
  clone.querySelectorAll('.no-print').forEach((node) => node.remove());
  clone.id = 'invoice-print-copy';

  clone.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src) img.src = new URL(src, window.location.href).href;
  });

  const sheetLinks = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => `<link rel="stylesheet" href="${link.href}" />`)
    .join('');

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=800');
  if (!printWindow) {
    window.print();
    return false;
  }

  const safeTitle = String(documentTitle).replace(/[<>"']/g, '');

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  ${sheetLinks}
  <style>
    @page { margin: 12mm; size: A4; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { padding: 16px; }
    .no-print { display: none !important; }
    #invoice-print-copy {
      max-width: 48rem;
      margin: 0 auto;
      box-shadow: none !important;
    }
  </style>
</head>
<body></body>
</html>`);
  printWindow.document.close();
  printWindow.document.body.appendChild(clone);

  const runPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  printWindow.onload = runPrint;
  setTimeout(runPrint, 400);

  printWindow.onafterprint = () => {
    printWindow.close();
  };

  return true;
}
