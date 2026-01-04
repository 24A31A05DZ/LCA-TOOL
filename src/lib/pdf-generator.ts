import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LCAResult } from '@/types/lca';

export function generatePDFReport(result: LCAResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors - Professional white header design
  const headerWhite = [255, 255, 255] as [number, number, number];
  const headerBorder = [220, 220, 220] as [number, number, number]; // Light gray border
  const primaryBlue = [33, 150, 243] as [number, number, number]; // Professional blue for accents
  const successGreen = [76, 175, 80] as [number, number, number]; // #4CAF50
  const errorRed = [244, 67, 54] as [number, number, number]; // #F44336
  const textDark = [33, 33, 33] as [number, number, number];
  const textGray = [100, 100, 100] as [number, number, number];

  // Compact Professional White Header
  doc.setFillColor(...headerWhite);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Add subtle border at bottom of header
  doc.setDrawColor(...headerBorder);
  doc.setLineWidth(0.5);
  doc.line(0, 35, pageWidth, 35);
  
  doc.setFontSize(18);
  doc.setTextColor(...textDark);
  doc.setFont(undefined, 'bold');
  doc.text('Environmental Compliance Report', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(...textGray);
  doc.setFont(undefined, 'normal');
  doc.text('Life Cycle Assessment (LCA)', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(...primaryBlue);
  doc.text(`${result.projectName}${result.companyName ? ` | ${result.companyName}` : ''}`, pageWidth / 2, 30, { align: 'center' });
  
  // Report Info - Compact
  doc.setFontSize(7);
  doc.setTextColor(...textGray);
  doc.text(`Date: ${new Date(result.timestamp).toLocaleDateString()}`, 14, 42);
  doc.text(`ID: LCA-${Date.now().toString(36).toUpperCase()}`, pageWidth - 14, 42, { align: 'right' });
  
  // Compact Sustainability Score Box
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 47, pageWidth - 28, 20, 2, 2, 'S');
  
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text('SUSTAINABILITY ASSESSMENT', 20, 55);
  
  // Score - Compact
  const gradeColor = result.sustainabilityScore.grade === 'A' || result.sustainabilityScore.grade === 'B' 
    ? successGreen 
    : result.sustainabilityScore.grade === 'C' 
    ? [255, 193, 7] as [number, number, number]
    : errorRed;
  doc.setFontSize(20);
  doc.setTextColor(...gradeColor);
  doc.text(`${result.sustainabilityScore.overall}`, 25, 63);
  doc.setFontSize(7);
  doc.setTextColor(...textGray);
  doc.text('/100', 40, 63);
  
  // Grade
  doc.setFontSize(16);
  doc.setTextColor(...gradeColor);
  doc.text(`Grade: ${result.sustainabilityScore.grade}`, 60, 63);
  
  // MCI
  doc.setFontSize(9);
  doc.setTextColor(...primaryBlue);
  doc.text(`MCI: ${result.sustainabilityScore.mciScore}%`, pageWidth - 30, 63);
  
  // Compact Impact Metrics Table
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Environmental Impact Metrics (IPCC AR6)', 14, 72);
  
  autoTable(doc, {
    startY: 75,
    head: [['Category', 'Value', 'Unit', 'Benchmark', 'Status']],
    body: result.impacts.map((impact) => [
      impact.category.length > 18 ? impact.category.substring(0, 15) + '...' : impact.category,
      impact.value.toLocaleString(),
      impact.unit,
      impact.benchmark.toLocaleString(),
      impact.status === 'good' ? 'PASS' : impact.status === 'warning' ? 'REVIEW' : 'ATTN',
    ]),
    theme: 'grid',
    headStyles: { fillColor: primaryBlue, textColor: [255, 255, 255], fontSize: 6 },
    bodyStyles: { textColor: textDark, fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25, halign: 'right' },
      2: { cellWidth: 18 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 20, fontStyle: 'bold' },
    },
    didParseCell: function(data) {
      if (data.column.index === 4 && data.section === 'body') {
        const value = data.cell.raw as string;
        if (value === 'PASS') {
          data.cell.styles.textColor = successGreen;
        } else if (value === 'REVIEW') {
          data.cell.styles.textColor = [255, 193, 7];
        } else if (value === 'ATTN') {
          data.cell.styles.textColor = errorRed;
        }
      }
    },
    margin: { left: 14, right: 14 },
  });
  
  // All Environmental Hotspots
  const hotspotsY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Environmental Hotspots', 14, hotspotsY);
  
  autoTable(doc, {
    startY: hotspotsY + 3,
    head: [['Area', 'Contribution %', 'Impact (kg CO2e)', 'Recommendation']],
    body: result.hotspots.map((hotspot) => [
      hotspot.area.length > 20 ? hotspot.area.substring(0, 17) + '...' : hotspot.area,
      `${hotspot.contribution}%`,
      hotspot.impact.toFixed(1),
      hotspot.recommendation.length > 35 ? hotspot.recommendation.substring(0, 32) + '...' : hotspot.recommendation,
    ]),
    theme: 'grid',
    headStyles: { fillColor: errorRed, textColor: [255, 255, 255], fontSize: 6 },
    bodyStyles: { fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 55 },
    },
    margin: { left: 14, right: 14 },
  });
  
  // SDG Alignment Table
  const sdgY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('UN SDG Alignment', 14, sdgY);
  
  autoTable(doc, {
    startY: sdgY + 3,
    head: [['SDG', 'Goal', 'Alignment', 'Assessment']],
    body: result.sdgAlignments.map((sdg) => [
      `SDG ${sdg.sdg}`,
      sdg.title.length > 25 ? sdg.title.substring(0, 22) + '...' : sdg.title,
      sdg.alignment.toUpperCase(),
      sdg.description.length > 30 ? sdg.description.substring(0, 27) + '...' : sdg.description,
    ]),
    theme: 'grid',
    headStyles: { fillColor: successGreen, textColor: [255, 255, 255], fontSize: 6 },
    bodyStyles: { fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20 },
      3: { cellWidth: 50 },
    },
    didParseCell: function(data) {
      if (data.column.index === 2 && data.section === 'body') {
        const value = data.cell.raw as string;
        if (value === 'POSITIVE') {
          data.cell.styles.textColor = successGreen;
        } else if (value === 'NEUTRAL') {
          data.cell.styles.textColor = [255, 193, 7];
        } else if (value === 'NEGATIVE') {
          data.cell.styles.textColor = errorRed;
        }
      }
    },
    margin: { left: 14, right: 14 },
  });
  
  // All Recommendations - Compact with overflow protection
  const recY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  const maxContentY = pageHeight - 50; // Reserve space for signature and footer
  
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Key Recommendations', 14, recY);
  
  let yPos = recY + 3;
  result.recommendations.forEach((rec, index) => {
    if (yPos > maxContentY) return; // Stop if we're running out of space
    doc.setFontSize(6);
    doc.setTextColor(...textGray);
    const text = `${index + 1}. ${rec}`;
    const lines = doc.splitTextToSize(text, pageWidth - 28);
    doc.text(lines, 16, yPos);
    yPos += lines.length * 3 + 1.5;
  });
  
  // Circular Economy Suggestions
  if (yPos < maxContentY) {
    yPos += 2;
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text('Circular Economy Opportunities', 14, yPos);
    yPos += 3;
    
    result.circularEconomySuggestions.forEach((sug, index) => {
      if (yPos > maxContentY) return;
      doc.setFontSize(6);
      doc.setTextColor(...textGray);
      const text = `${index + 1}. ${sug}`;
      const lines = doc.splitTextToSize(text, pageWidth - 28);
      doc.text(lines, 16, yPos);
      yPos += lines.length * 3 + 1.5;
    });
  }
  
  // AI Recommendations (if available)
  if (result.aiRecommendations && result.aiRecommendations.length > 0 && yPos < maxContentY) {
    yPos += 2;
    doc.setFontSize(8);
    doc.setTextColor(...primaryBlue);
    doc.text('AI-Powered Recommendations', 14, yPos);
    yPos += 3;
    
    result.aiRecommendations.forEach((rec, index) => {
      if (yPos > maxContentY) return;
      doc.setFontSize(6);
      doc.setTextColor(...textGray);
      const text = `${index + 1}. ${rec}`;
      const lines = doc.splitTextToSize(text, pageWidth - 28);
      doc.text(lines, 16, yPos);
      yPos += lines.length * 3 + 1.5;
    });
  }
  
  // Validation Warnings (if any)
  if (result.validationWarnings.length > 0 && yPos < maxContentY) {
    yPos += 2;
    doc.setFontSize(7);
    doc.setTextColor(...errorRed);
    doc.text('Data Validation Notes:', 14, yPos);
    yPos += 3;
    
    result.validationWarnings.forEach((warning) => {
      if (yPos > maxContentY) return;
      doc.setFontSize(6);
      doc.setTextColor(...textGray);
      const text = `• ${warning.field}: ${warning.message}`;
      const lines = doc.splitTextToSize(text, pageWidth - 28);
      doc.text(lines, 16, yPos);
      yPos += lines.length * 3 + 1;
    });
  }
  
  // Compliance Statement & Signature Area - Fixed position at bottom
  const signatureY = pageHeight - 40;
  doc.setDrawColor(...headerBorder);
  doc.setLineWidth(0.3);
  doc.line(14, signatureY, pageWidth - 14, signatureY);
  
  doc.setFontSize(6);
  doc.setTextColor(...textGray);
  const complianceText = `This LCA conducted per ISO 14040/14044 using IPCC AR6 & Ecoinvent 3.9. Score: ${result.sustainabilityScore.overall}/100 (${result.sustainabilityScore.grade}).`;
  const complianceLines = doc.splitTextToSize(complianceText, pageWidth - 28);
  doc.text(complianceLines, 14, signatureY + 4);
  
  // Signature lines
  const sigLineY = signatureY + complianceLines.length * 3.5 + 6;
  doc.setDrawColor(...textGray);
  doc.setLineWidth(0.5);
  doc.line(14, sigLineY, 70, sigLineY);
  doc.line(pageWidth - 70, sigLineY, pageWidth - 14, sigLineY);
  
  doc.setFontSize(6);
  doc.setTextColor(...textGray);
  doc.text('Environmental Officer Signature', 14, sigLineY + 5);
  doc.text('Date', pageWidth - 70, sigLineY + 5);
  
  // Footer
  doc.setFontSize(6);
  doc.setTextColor(...textGray);
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  
  doc.text(
    'AI-Driven LCA Tool | Metallurgy & Mining Sustainability | IPCC AR6 & Ecoinvent Standards',
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );
  
  // Open in new tab
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}
