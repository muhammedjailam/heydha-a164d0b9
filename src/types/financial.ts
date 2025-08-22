export interface Transaction {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  category?: string;
  isExpense: boolean;
  amount: number;
}

export interface CategoryMapping {
  [vendor: string]: string;
}

export interface ChartDataPoint {
  date: string;
  amount: number;
  label?: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface VendorSpending {
  vendor: string;
  amount: number;
  transactions: number;
}

export interface DateFilter {
  type: 'daily' | 'monthly' | 'yearly';
  customRange?: {
    start: Date;
    end: Date;
  };
}