import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LeaveRequest, User, LeavePolicy, LeaveLedgerEntry } from '../../types';

// Function to export data to CSV
export const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
            // Escape double quotes and wrap if cell contains comma
            cell = cell.replace(/"/g, '""');
            if (cell.includes(',')) {
                cell = `"${cell}"`;
            }
            return cell;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Function to export data to PDF
export const exportToPDF = (
    columns: { header: string, dataKey: string }[],
    data: any[],
    filename: string,
    title: string
) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 28);


    autoTable(doc, {
        head: [columns.map(c => c.header)],
        body: data.map(row => columns.map(col => row[col.dataKey] ?? '')),
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }, // Emerald color for TRUBank theme
        styles: {
            fontSize: 8,
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        }
    });

    doc.save(`${filename}.pdf`);
};

// Helper to calculate leave duration
export const getLeaveDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
    return diffDays;
};

// Replicates the logo from the official form image
const drawFormLogo = (doc: jsPDF, x: number, y: number) => {
    doc.saveGraphicsState();
    
    // Green rounded box
    doc.setFillColor(0, 102, 51); // Dark Green
    doc.roundedRect(x, y, 20, 10, 3, 3, 'F');
    
    // White 'F'-like shape inside
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.path([
        {op: 'm', c: [x + 5, y + 7]}, // move to bottom left of shape
        {op: 'l', c: [x + 10, y + 7]}, // line to right
        {op: 'm', c: [x + 5, y + 3]}, // move to top left
        {op: 'c', c: [x + 5, y + 3, x + 15, y + 3, x + 15, y+5]},
        {op: 'l', c: [x + 15, y + 5]}
    ]).stroke();

    doc.restoreGraphicsState();
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('First TRuBank', x + 25, y + 5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('A Rural Bank, Inc.', x + 25, y + 10);
};

export const generateLeaveFormPDF = (request: LeaveRequest, user: User, policy: LeavePolicy) => {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageContentWidth = pageWidth - margin * 2;
    let y = margin;

    // Outer Border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.rect(margin - 4, margin - 4, pageContentWidth + 8, 280);
    doc.setLineWidth(0.2);
    
    // Header
    drawFormLogo(doc, margin, y);
    doc.setFontSize(9);
    doc.text('Personnel Form No. __________', pageWidth - margin, y + 3, { align: 'right' });
    doc.text(`Date Prepared: ${new Date().toLocaleDateString()}`, pageWidth - margin, y + 8, { align: 'right' });
    y += 15;
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);

    // Title
    y += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('APPLICATION FOR LEAVE', pageWidth / 2, y, { align: 'center' });
    y += 5;

    // User Details
    autoTable(doc, {
        startY: y,
        theme: 'plain',
        body: [
            [
                { content: `Name & Designation:\n${user.name} / ${user.role}`, styles: { fontStyle: 'normal' } },
                { content: `Employment Status:\n******`, styles: { fontStyle: 'normal' } },
                { content: `Branch/Department:\n${user.department}`, styles: { fontStyle: 'normal' } }
            ],
            [
                { content: `Address while on Leave:\n******`, styles: { fontStyle: 'normal' } },
                { content: `Date Employed:\n******`, styles: { fontStyle: 'normal' } },
                { content: `Daily/Monthly Rate:\n`, styles: { fontStyle: 'normal' } }
            ]
        ],
        styles: { cellPadding: 2, fontSize: 8, lineWidth: 0.2, lineColor: 0, font: 'helvetica' },
        margin: { left: margin, right: margin }
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // Leave Application
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Leave applied for (Check action desired)', margin, y);
    y += 2;
    
    const leaveTypesBody = policy.availableLeaveTypes.map(lt => {
        return [`( ${request.leaveType === lt.name ? 'X' : ' '} ) ${lt.name}`, '', '', ''];
    });

    const duration = getLeaveDuration(request.startDate, request.endDate);

    autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [['', 'DAYS', 'From', 'To']],
        headStyles: { halign: 'center', fontStyle: 'bold' },
        body: leaveTypesBody,
        styles: { cellPadding: 2, fontSize: 8, lineWidth: 0.2, lineColor: 0, font: 'helvetica' },
        columnStyles: {
            0: { cellWidth: pageContentWidth * 0.5 },
            1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.row.index === 0) {
                 if (data.column.index >= 1) {
                    const texts = [`${duration} day/s`, request.startDate, request.endDate];
                    const text = texts[data.column.index - 1];
                    const cellHeight = data.row.height * leaveTypesBody.length;
                    
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.text(text, data.cell.x + data.cell.width / 2, data.cell.y + cellHeight / 2, {
                        halign: 'center', valign: 'middle'
                    });
                }
            }
        },
        margin: { left: margin, right: margin }
    });
    y = (doc as any).lastAutoTable.finalY;

    // Reasons
    autoTable(doc, {
        startY: y,
        theme: 'grid',
        body: [[{ content: `REASONS:\n${request.reason}`, styles: { fontStyle: 'bold', minCellHeight: 20 } }]],
        styles: { cellPadding: 2, fontSize: 9, lineWidth: 0.2, lineColor: 0, font: 'helvetica' },
        margin: { left: margin, right: margin }
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Leave Data
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LEAVE DATA', pageWidth / 2, y, { align: 'center', charSpace: 2 });
    y += 5;

    autoTable(doc, {
        startY: y, theme: 'grid',
        body: [
            ['Days entitled to:', ''], ['Days taken:', ''], ['Balance:', ''],
            ['Days applied for:', `${duration}`], ['Balance of Leave:', '']
        ],
        columnStyles: { 0: { cellWidth: pageContentWidth * 0.33, fontStyle: 'normal' }, 1: { fontStyle: 'bold'} },
        styles: { cellPadding: 2, fontSize: 9, lineWidth: 0.2, lineColor: 0, font: 'helvetica' },
        margin: { left: margin, right: margin }
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // Signatures
    doc.setFontSize(9);
    doc.text('Requested by:', margin + pageContentWidth * 0.25, y, { align: 'center' });
    doc.line(margin + 5, y + 7, margin + pageContentWidth * 0.5 - 5, y + 7);
    doc.text(user.name, margin + pageContentWidth * 0.25, y + 6, { align: 'center' });
    
    doc.text('Approved by:', pageWidth - margin - pageContentWidth * 0.25, y, { align: 'center' });
    doc.line(pageWidth - margin - pageContentWidth * 0.5 + 5, y + 7, pageWidth - margin - 5, y + 7);

    doc.save('leave_application.pdf');
};

export const generateLeaveLedgerPDF = (user: User, ledgerEntries: LeaveLedgerEntry[]) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const yStart = margin;

    const leftTableWidth = (pageWidth - margin * 2) * 0.3;
    const rightTableStartX = margin + leftTableWidth;

    // --- Left Side ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`NAME OF EMPLOYEE`, margin, yStart + 3);
    doc.text(user.name, margin + 40, yStart + 3);
    doc.text(`DATE HIRED`, margin, yStart + 8);
    doc.text(`******`, margin + 40, yStart + 8);
    
    const dateRows: string[][] = [];
    const totalRowsInView = 10;
    for (let i = 0; i < totalRowsInView; i++) {
        dateRows.push(['']);
    }

    const currentYear = new Date().getFullYear();
    const availedSL = ledgerEntries.filter(e => e.transactionType === 'Used - Sick').reduce((sum, e) => sum + Math.abs(e.days), 0);
    const availedVL = ledgerEntries.filter(e => e.transactionType === 'Used - Vacation').reduce((sum, e) => sum + Math.abs(e.days), 0);
    const forwardedSL = ledgerEntries.find(e => e.transactionType === 'Carry-over')?.days || 0;
    
    autoTable(doc, {
        startY: yStart + 10,
        theme: 'grid',
        head: [['DATE']],
        headStyles: { fontStyle: 'bold' },
        body: dateRows,
        foot: [
            ['Allocated SL andVL'], ['Availed SL/VL'],
            [`Current Balance ${currentYear}`], [`Forwarded SL from ${currentYear-1}`], ['Accumulated SL']
        ],
        footStyles: { fontStyle: 'bold', cellPadding: {top: 1, bottom: 1.5} },
        styles: { fontSize: 8, cellPadding: 1, minCellHeight: 6.5, lineWidth: 0.2, lineColor: 0 },
        tableWidth: leftTableWidth,
        margin: { left: margin },
    });

    // --- Right Side ---
    const transactionRows: string[][] = [];
    const transactionRowsToDisplay = 15;
    for (let i = 0; i < transactionRowsToDisplay; i++) {
        transactionRows.push(['', '', '', '', '', '']);
    }
    
    autoTable(doc, {
        startY: yStart + 10,
        theme: 'grid',
        head: [['REMARKS', 'SL', 'VL', 'Maternity', 'Paternity', 'Without Pay']],
        headStyles: { fontStyle: 'bold', halign: 'center', cellPadding: 1 },
        body: transactionRows,
        foot: [['', availedSL.toFixed(2), availedVL.toFixed(2), '0.00', '0.00', '0.00']],
        footStyles: { fontStyle: 'bold', halign: 'center', cellPadding: 1 },
        styles: { fontSize: 8, cellPadding: 1, minCellHeight: 6.5, lineWidth: 0.2, lineColor: 0, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 'auto' }, 1: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 12, halign: 'center' },
            3: { cellWidth: 12, halign: 'center' }, 4: { cellWidth: 12, halign: 'center' }, 5: { cellWidth: 15, halign: 'center' }
        },
        didDrawCell: (data) => {
            const rotatedHeaders = ['Maternity', 'Paternity', 'Without Pay'];
            if (data.section === 'head' && data.column.index >= 3) {
                // Manually draw rotated text
                doc.setFontSize(8);
                doc.text(rotatedHeaders[data.column.index - 3], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height - 2, {
                    angle: 270, align: 'center'
                });
            }
        },
        margin: { left: rightTableStartX },
    });
    
    doc.save(`${user.name}_leave_ledger.pdf`);
};
