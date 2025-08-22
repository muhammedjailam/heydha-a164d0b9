import React from 'react';
import { Transaction } from '@/types/financial';
import { format } from 'date-fns';

interface PrintLayoutProps {
  transactions: Transaction[];
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ transactions }) => {
  // Calculate totals
  const totalIncome = transactions
    .filter(t => !t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netFlow = totalIncome - totalExpenses;
  
  // Get statement period
  const dates = transactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  
  // Clean vendor name function
  const cleanVendorName = (description: string): string => {
    const vendor = description.split(' ')[0] || 'Unknown';
    return vendor.replace(/="/g, '').replace(/"/g, '');
  };
  
  // Group transactions by vendor
  const vendorGroups = transactions.reduce((acc, transaction) => {
    const vendor = cleanVendorName(transaction.description);
    if (!acc[vendor]) {
      acc[vendor] = [];
    }
    acc[vendor].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Sort vendors by total transaction amount (descending)
  const sortedVendors = Object.entries(vendorGroups).sort(([, a], [, b]) => {
    const totalA = a.reduce((sum, t) => sum + t.amount, 0);
    const totalB = b.reduce((sum, t) => sum + t.amount, 0);
    return totalB - totalA;
  });

  // Group transactions by date within each vendor
  const groupByDate = (transactions: Transaction[]) => {
    return transactions.reduce((acc, transaction) => {
      const dateKey = format(transaction.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);
  };

  return (
    <div className="print-layout bg-white text-black p-8 max-w-none">
      <style>{`
        @media print {
          .print-layout {
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Financial Statement Report</h1>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Statement Period:</p>
            <p className="font-semibold">
              {startDate && endDate && `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Generated:</p>
            <p className="font-semibold">{format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8 border border-gray-300 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Financial Summary</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-2xl font-bold text-green-600">
              ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Net Flow</p>
            <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions by Vendor */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Detailed Transactions by Vendor</h2>
        
        {sortedVendors.map(([vendor, vendorTransactions]) => {
          const vendorTotal = vendorTransactions.reduce((sum, t) => sum + t.amount, 0);
          const dateGroups = groupByDate(vendorTransactions);
          const sortedDates = Object.keys(dateGroups).sort();
          
          return (
            <div key={vendor} className="border border-gray-300 rounded-lg p-4 break-inside-avoid">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">{vendor}</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-bold">
                    ${vendorTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              
              {sortedDates.map(date => (
                <div key={date} className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    {format(new Date(date), 'EEEE, MMM dd, yyyy')}
                  </h4>
                  
                  <div className="space-y-1">
                    {dateGroups[date].map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center py-1 px-3 bg-gray-50 rounded text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{transaction.description}</p>
                          {transaction.category && (
                            <p className="text-gray-600 text-xs">{transaction.category}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.isExpense ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.isExpense ? '-' : '+'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
        <p>This report was generated locally in your browser. No financial data was transmitted or stored externally.</p>
      </div>
    </div>
  );
};

export default PrintLayout;