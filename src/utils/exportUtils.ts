import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportRecapToExcel(
  title: string,
  meta: { sekolah: string; kelas: string; periode: string; totalSiswa: number },
  data: Array<{
    no: number;
    nama: string;
    kelas?: string;
    hadir: number;
    tidakHadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    persentase: string;
  }>,
  fileName: string = 'laporan-absensi-solat.xlsx'
) {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // Header rows
  const wsData = [
    [title.toUpperCase()],
    [`Sekolah: ${meta.sekolah}`],
    [`Kelas: ${meta.kelas}`],
    [`Periode: ${meta.periode}`],
    [`Jumlah Siswa: ${meta.totalSiswa}`],
    [], // Blank line
    ['No', 'Nama Siswa', 'Kelas', 'Hadir', 'Tidak Hadir', 'Izin', 'Sakit', 'Uzur/Haid', '% Kehadiran'],
  ];

  data.forEach((row) => {
    wsData.push([
      row.no as any,
      row.nama,
      row.kelas || meta.kelas,
      row.hadir as any,
      row.tidakHadir as any,
      row.izin as any,
      row.sakit as any,
      row.uzur as any,
      row.persentase,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 30 }, // Nama Siswa
    { wch: 14 }, // Kelas
    { wch: 10 }, // Hadir
    { wch: 12 }, // Tidak Hadir
    { wch: 10 }, // Izin
    { wch: 10 }, // Sakit
    { wch: 12 }, // Uzur
    { wch: 14 }, // %
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');
  XLSX.writeFile(wb, fileName);
}

export function exportRecapToPDF(
  title: string,
  meta: { sekolah: string; kelas: string; periode: string; totalSiswa: number },
  data: Array<{
    no: number;
    nama: string;
    kelas?: string;
    hadir: number;
    tidakHadir: number;
    izin: number;
    sakit: number;
    uzur: number;
    persentase: string;
  }>,
  fileName: string = 'laporan-absensi-solat.pdf'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header
  doc.setFontSize(16);
  doc.setTextColor(15, 76, 58); // Emerald dark
  doc.text(title.toUpperCase(), 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Sekolah       : ${meta.sekolah}`, 14, 26);
  doc.text(`Kelas          : ${meta.kelas}`, 14, 32);
  doc.text(`Periode       : ${meta.periode}`, 14, 38);
  doc.text(`Total Siswa : ${meta.totalSiswa}`, 120, 26);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 120, 32);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 43, 196, 43);

  // Table
  const tableRows = data.map((d) => [
    d.no,
    d.nama,
    d.hadir,
    d.tidakHadir,
    d.izin,
    d.sakit,
    d.uzur,
    d.persentase,
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'Nama Siswa', 'Hadir', 'Alfa', 'Izin', 'Sakit', 'Uzur', '% Hadir']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 120, 85], // Emerald green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
    },
    foot: [
      [
        'Total',
        '',
        data.reduce((acc, r) => acc + r.hadir, 0),
        data.reduce((acc, r) => acc + r.tidakHadir, 0),
        data.reduce((acc, r) => acc + r.izin, 0),
        data.reduce((acc, r) => acc + r.sakit, 0),
        data.reduce((acc, r) => acc + r.uzur, 0),
        '',
      ],
    ],
    footStyles: {
      fillColor: [240, 245, 242],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      halign: 'center',
    },
  });

  doc.save(fileName);
}
