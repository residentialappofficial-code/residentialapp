import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Exports data to PDF report
 * @param {string} title 
 * @param {Array<string>} headers 
 * @param {Array<Array<any>>} rows 
 * @param {string} filename 
 */
export const exportToPDF = (title, headers, rows, filename = "report.pdf") => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 21);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 24, 196, 24);

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 28,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], halign: "left" },
    styles: { fontSize: 8, cellPadding: 3, font: "Helvetica" },
    margin: { left: 14, right: 14 }
  });

  doc.save(filename);
};

/**
 * Exports JSON data to Excel file
 * @param {Array<Object>} data 
 * @param {string} filename 
 */
export const exportToExcel = (data, filename = "report.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
  XLSX.writeFile(workbook, filename);
};

/**
 * Prints invoice receipt PDF for a payment
 * @param {Object} warga 
 * @param {Object} bill 
 */
export const printInvoice = (warga, bill) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [100, 130] });
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text("KUITANSI PEMBAYARAN IURAN", 50, 12, { align: "center" });
  
  doc.setFontSize(7);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(100);
  doc.text("HABITIX RESIDENTIAL SYSTEM", 50, 16, { align: "center" });
  
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 20, 90, 20);

  let y = 27;
  const writeRow = (label, val) => {
    doc.setFont("Helvetica", "bold");
    doc.text(label, 10, y);
    doc.setFont("Helvetica", "normal");
    doc.text(String(val), 40, y);
    y += 6;
  };

  writeRow("Nama Warga:", warga?.nama || "-");
  writeRow("Unit / Blok:", warga?.blok || "-");
  writeRow("Periode Iuran:", `${bill?.bulan || "-"}/${bill?.tahun || "-"}`);
  writeRow("Nominal Iuran:", `Rp ${(bill?.jumlah || 0).toLocaleString('id-ID')}`);
  writeRow("Status:", bill?.status === 'Paid' ? 'LUNAS (TERVERIFIKASI)' : 'BELUM BAYAR');
  writeRow("Tanggal Bayar:", bill?.created_at ? new Date(bill.created_at).toLocaleDateString('id-ID') : "-");

  doc.line(10, y + 2, 90, y + 2);
  
  doc.setFontSize(7);
  doc.setFont("Helvetica", "italic");
  doc.text("Terima kasih atas pembayaran iuran Anda.", 50, y + 8, { align: "center" });
  doc.text("Kuitansi digital ini sah diterbitkan oleh sistem.", 50, y + 12, { align: "center" });

  doc.save(`Kuitansi_${warga?.blok || "warga"}_${bill?.bulan || "0"}_${bill?.tahun || "0"}.pdf`);
};
