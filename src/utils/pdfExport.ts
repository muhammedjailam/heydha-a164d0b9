import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import React from 'react';
import PrintLayout from '@/components/PrintLayout';
import { Transaction } from '@/types/financial';

export const exportToPDF = async (transactions: Transaction[], filename: string = 'financial-dashboard.pdf') => {
  try {
    // Show a loading state
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50';
    loadingToast.textContent = 'Generating PDF...';
    document.body.appendChild(loadingToast);

    // Create a temporary container for the print layout
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';
    printContainer.style.width = '210mm'; // A4 width
    printContainer.style.background = 'white';
    document.body.appendChild(printContainer);

    // Render the PrintLayout component
    const root = createRoot(printContainer);
    root.render(React.createElement(PrintLayout, { transactions }));

    // Wait for rendering to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create canvas from the print layout
    const canvas = await html2canvas(printContainer, {
      backgroundColor: '#ffffff',
      scale: 1.5, // Higher resolution for print
      useCORS: true,
      allowTaint: false,
      logging: false,
      height: printContainer.scrollHeight,
      width: printContainer.scrollWidth
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add title page
    pdf.setFontSize(24);
    pdf.text('Financial Dashboard Report', 20, 30);
    
    pdf.setFontSize(12);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`Generated on: ${currentDate}`, 20, 45);
    
    // Add privacy disclaimer
    pdf.setFontSize(10);
    pdf.text('Privacy Notice: This report was generated locally in your browser.', 20, 60);
    pdf.text('No financial data was transmitted or stored on any external server.', 20, 68);
    
    // Add dashboard image
    if (imgHeight <= pageHeight) {
      // Single page
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // Multiple pages
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }
    
    // Clean up
    root.unmount();
    document.body.removeChild(printContainer);
    
    // Save the PDF
    pdf.save(filename);
    
    // Remove loading toast
    document.body.removeChild(loadingToast);
    
    // Show success message
    const successToast = document.createElement('div');
    successToast.className = 'fixed top-4 right-4 bg-success text-success-foreground px-4 py-2 rounded-lg shadow-lg z-50';
    successToast.textContent = 'PDF exported successfully!';
    document.body.appendChild(successToast);
    
    setTimeout(() => {
      document.body.removeChild(successToast);
    }, 3000);
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    
    // Show error message
    const errorToast = document.createElement('div');
    errorToast.className = 'fixed top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg z-50';
    errorToast.textContent = 'Failed to export PDF. Please try again.';
    document.body.appendChild(errorToast);
    
    setTimeout(() => {
      if (document.body.contains(errorToast)) {
        document.body.removeChild(errorToast);
      }
    }, 5000);
  }
};