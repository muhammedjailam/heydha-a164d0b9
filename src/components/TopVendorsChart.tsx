import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction, VendorSpending } from '@/types/financial';

interface TopVendorsChartProps {
  transactions: Transaction[];
  topN?: number;
}

const TopVendorsChart = ({ transactions, topN = 10 }: TopVendorsChartProps) => {
  const cleanVendorName = (description: string): string => {
    // Remove =" and extra quotes and clean up the description
    return description
      .replace(/^="|"$/g, '') // Remove =" at start and " at end
      .replace(/^""|""$/g, '') // Remove double quotes
      .replace(/^"|"$/g, '')   // Remove single quotes
      .trim();
  };

  const truncateVendor = (vendor: string, maxLength: number = 25): string => {
    return vendor.length > maxLength ? vendor.substring(0, maxLength) + '...' : vendor;
  };
  
  const vendorData = useMemo(() => {
    const expenses = transactions.filter(t => t.isExpense);
    
    // Group by vendor (description)
    const vendorTotals: { [vendor: string]: { amount: number; count: number } } = {};
    
    expenses.forEach(transaction => {
      const vendor = cleanVendorName(transaction.description);
      if (!vendorTotals[vendor]) {
        vendorTotals[vendor] = { amount: 0, count: 0 };
      }
      vendorTotals[vendor].amount += transaction.amount;
      vendorTotals[vendor].count += 1;
    });
    
    // Convert to array and sort by amount
    const vendorArray: VendorSpending[] = Object.entries(vendorTotals)
      .map(([vendor, data]) => ({
        vendor: truncateVendor(vendor),
        amount: data.amount,
        transactions: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, topN);
      
    return vendorArray;
  }, [transactions, topN, truncateVendor, cleanVendorName]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="gradient-text">Top Vendors by Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {vendorData.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="text-right font-semibold">Total Spent</TableHead>
                  <TableHead className="text-right font-semibold">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorData.map((vendor, index) => (
                  <TableRow key={vendor.vendor}>
                    <TableCell className="font-medium">{vendor.vendor}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(vendor.amount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {vendor.transactions}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No vendor data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopVendorsChart;