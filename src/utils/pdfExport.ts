import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | 'legal';
  margin?: number;
}

export const exportToPDF = async (
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> => {
  const {
    filename = 'sales-report.pdf',
    title = 'Sales Report',
    subtitle = '',
    orientation = 'portrait',
    format = 'a4',
    margin = 20
  } = options;

  try {
    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const imgWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = imgHeight;
    let position = margin;

    // Add title and subtitle
    if (title) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, margin);
      position += 10;
    }

    if (subtitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subtitle, margin, position);
      position += 10;
    }

    // Add the image
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - position - margin);

    // Add new pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export const exportSalesReportToPDF = async (
  element: HTMLElement,
  monthName: string
): Promise<void> => {
  const options: PDFExportOptions = {
    filename: `sales-report-${monthName.toLowerCase().replace(' ', '-')}.pdf`,
    title: 'Sales Report',
    subtitle: `Monthly Report - ${monthName}`,
    orientation: 'landscape',
    format: 'a4',
    margin: 15
  };

  await exportToPDF(element, options);
}; 