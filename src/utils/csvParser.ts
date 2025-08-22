import Papa from 'papaparse';
import { Transaction } from '@/types/financial';

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const transactions = processCSVData(results.data as string[][]);
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
      skipEmptyLines: true
    });
  });
};

const cleanDescription = (description: string): string => {
  // Remove extra quotes and formatting from description field
  return description
    .replace(/^=""|""$/g, '') // Remove ="" and "" at start/end
    .replace(/^"|"$/g, '')    // Remove quotes at start/end
    .trim();
};

const processCSVData = (data: string[][]): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // Skip header row if it exists (check if first row contains non-date data)
  const startRow = isHeaderRow(data[0]) ? 1 : 0;
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    
    // Ensure we have enough columns
    if (row.length < 10) continue;
    
    try {
      // Parse according to the specified column structure
      const dateStr = row[0]?.trim(); // Column 1: Transaction Date
      const description = cleanDescription(row[6]?.trim() || ''); // Column 7: Description
      const debitStr = row[8]?.trim() || '0'; // Column 9: Debit
      const creditStr = row[9]?.trim() || '0'; // Column 10: Credit
      
      // Skip if no date or description
      if (!dateStr || !description) continue;
      
      // Parse date (YYYY/MM/DD format)
      const date = parseDate(dateStr);
      if (!date) continue;
      
      // Parse amounts
      const debit = parseFloat(debitStr) || 0;
      const credit = parseFloat(creditStr) || 0;
      
      // Skip if no transaction amount
      if (debit === 0 && credit === 0) continue;
      
      const transaction: Transaction = {
        id: `${date.getTime()}-${i}`,
        date,
        description,
        debit,
        credit,
        isExpense: debit > 0,
        amount: debit > 0 ? debit : credit
      };
      
      transactions.push(transaction);
    } catch (error) {
      console.warn(`Skipping row ${i} due to parsing error:`, error);
      continue;
    }
  }
  
  // Sort transactions by date (newest first)
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const isHeaderRow = (row: string[]): boolean => {
  if (!row || row.length === 0) return false;
  
  // Check if first column looks like a date
  const firstCell = row[0]?.trim();
  return !firstCell || !/^\d{4}\/\d{2}\/\d{2}$/.test(firstCell);
};

const parseDate = (dateStr: string): Date | null => {
  // Expected format: YYYY/MM/DD
  const match = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  
  const [, year, month, day] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Validate the date
  if (isNaN(date.getTime())) return null;
  
  return date;
};

export const getStatementPeriod = (transactions: Transaction[]): { start: string; end: string } => {
  if (transactions.length === 0) {
    return { start: 'N/A', end: 'N/A' };
  }
  
  const dates = transactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
  const start = dates[0];
  const end = dates[dates.length - 1];
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
};