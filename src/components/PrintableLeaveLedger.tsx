import React from 'react';
import { LeaveLedgerEntry, User } from '../../types';

interface PrintableLeaveLedgerProps {
  user: User | null;
  ledgerEntries: LeaveLedgerEntry[] | null;
}

interface LedgerRow {
  date: string;
  remarks: string;
  SL: string;
  VL: string;
  Maternity: string;
  Paternity: string;
  WithoutPay: string;
}

const PrintableLeaveLedger: React.FC<PrintableLeaveLedgerProps> = ({ user, ledgerEntries }) => {
  if (!user || !ledgerEntries) {
    return null;
  }
  
  const availedSL = ledgerEntries
    .filter(e => e.transactionType === 'Used - Sick')
    .reduce((sum, e) => sum + Math.abs(e.days), 0);
  const availedVL = ledgerEntries
    .filter(e => e.transactionType === 'Used - Vacation')
    .reduce((sum, e) => sum + Math.abs(e.days), 0);
    
  const forwardedEntry = ledgerEntries.find(e => e.transactionType === 'Carry-over');
  const forwardedSL = forwardedEntry ? Math.abs(forwardedEntry.days) : 0; // Assuming carry-over is SL as per form

  const currentYear = new Date().getFullYear();

  const ledgerRows: LedgerRow[] = ledgerEntries
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
        let SL = '', VL = '';
        if (entry.transactionType === 'Used - Sick') SL = Math.abs(entry.days).toFixed(2);
        if (entry.transactionType === 'Used - Vacation') VL = Math.abs(entry.days).toFixed(2);
        // Note: Other leave types are not in the current ledger data model.
        return {
            date: new Date(entry.date + 'T00:00:00').toLocaleDateString(),
            remarks: entry.transactionType,
            SL, VL, Maternity: '', Paternity: '', WithoutPay: '',
        };
    });
  
  // Fill with empty rows to match the template's look
  const totalRows = 15;
  while(ledgerRows.length < totalRows) {
      ledgerRows.push({ date: '', remarks: '', SL: '', VL: '', Maternity: '', Paternity: '', WithoutPay: '' });
  }

  const ColumnHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <th className="border border-black font-bold p-0 w-8 h-24 relative">
          <div className="absolute inset-0 flex items-center justify-center">
              <span className="transform -rotate-90 whitespace-nowrap">{children}</span>
          </div>
      </th>
  );

  return (
    <div className="font-serif text-black bg-white p-2 text-xs">
      <div className="flex flex-row w-full space-x-2">
        {/* Left Side */}
        <div className="w-1/3 border border-black p-2">
          <div className="text-center font-bold">
            <p>NAME OF EMPLOYEE: <span className="font-normal underline">{user.name}</span></p>
            <p>DATE HIRED: <span className="font-normal underline">{"N/A"}</span></p>
          </div>
          <table className="w-full border-collapse border border-black mt-2">
            <thead>
              <tr><th className="border border-black p-1 font-bold">DATE</th></tr>
            </thead>
            <tbody>
              {ledgerRows.slice(0, 10).map((row, index) => (
                <tr key={`date-row-${index}`}><td className="border border-black p-1 h-6">{row.date}</td></tr>
              ))}
              <tr><td className="border border-black p-1 h-6 font-bold">Allocated SL and VL</td></tr>
              <tr><td className="border border-black p-1 h-6 font-bold">Availed SL/VL</td></tr>
              <tr><td className="border border-black p-1 h-6 font-bold">Current Balance {currentYear}</td></tr>
              <tr><td className="border border-black p-1 h-6 font-bold">Forwarded SL from {currentYear - 1}</td></tr>
              <tr><td className="border border-black p-1 h-6 font-bold">Accumulated SL</td></tr>
            </tbody>
          </table>
        </div>

        {/* Right Side */}
        <div className="w-2/3 border border-black p-2">
           <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black p-1 font-bold w-auto">REMARKS</th>
                <th className="border border-black p-1 font-bold w-12">SL</th>
                <th className="border border-black p-1 font-bold w-12">VL</th>
                <ColumnHeader>Maternity</ColumnHeader>
                <ColumnHeader>Paternity</ColumnHeader>
                <ColumnHeader>Without Pay</ColumnHeader>
              </tr>
            </thead>
            <tbody>
                {ledgerRows.map((row, index) => (
                    <tr key={`data-row-${index}`}>
                        <td className="border border-black p-1 h-6">{row.remarks}</td>
                        <td className="border border-black p-1 h-6 text-center">{row.SL || (index === 11 ? availedSL.toFixed(2) : '')}</td>
                        <td className="border border-black p-1 h-6 text-center">{row.VL || (index === 11 ? availedVL.toFixed(2) : '')}</td>
                        <td className="border border-black p-1 h-6 text-center">{row.Maternity}</td>
                        <td className="border border-black p-1 h-6 text-center">{row.Paternity}</td>
                        <td className="border border-black p-1 h-6 text-center">{row.WithoutPay}</td>
                    </tr>
                ))}
                 <tr>
                    <td className="border border-black p-1 h-6 text-right font-bold">Totals:</td>
                    <td className="border border-black p-1 h-6 text-center font-bold">{availedSL.toFixed(2)}</td>
                    <td className="border border-black p-1 h-6 text-center font-bold">{availedVL.toFixed(2)}</td>
                    <td className="border border-black p-1 h-6 text-center font-bold">0.00</td>
                    <td className="border border-black p-1 h-6 text-center font-bold">0.00</td>
                    <td className="border border-black p-1 h-6 text-center font-bold">0.00</td>
                </tr>
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            @page {
                size: legal landscape;
                margin: 0.25in;
            }
        }
      `}</style>
    </div>
  );
};

export default PrintableLeaveLedger;
