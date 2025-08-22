import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, VendorSpending } from '@/types/financial';

interface TopVendorsChartProps {
  transactions: Transaction[];
  topN?: number;
}

const TopVendorsChart = ({ transactions, topN = 10 }: TopVendorsChartProps) => {
  const vendorData = useMemo(() => {
    const expenses = transactions.filter(t => t.isExpense);
    
    // Group by vendor (description)
    const vendorTotals: { [vendor: string]: { amount: number; count: number } } = {};
    
    expenses.forEach(transaction => {
      const vendor = transaction.description;
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
  }, [transactions, topN]);
  
  const truncateVendor = (vendor: string, maxLength: number = 25): string => {
    return vendor.length > maxLength ? vendor.substring(0, maxLength) + '...' : vendor;
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.vendor}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.amount)} • {data.transactions} transaction{data.transactions !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="gradient-text">Top Vendors by Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {vendorData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={vendorData}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number" 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="vendor"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--secondary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
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