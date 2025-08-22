import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Transaction, ChartDataPoint, DateFilter } from '@/types/financial';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface SpendingChartProps {
  transactions: Transaction[];
}

const SpendingChart = ({ transactions }: SpendingChartProps) => {
  const [filter, setFilter] = useState<DateFilter>({ type: 'daily' });
  
  const chartData = useMemo(() => {
    let filteredTransactions = transactions.filter(t => t.isExpense);
    
    // Apply date range filter if set
    if (filter.customRange) {
      const { start, end } = filter.customRange;
      filteredTransactions = filteredTransactions.filter(t => 
        isWithinInterval(t.date, { 
          start: startOfDay(start), 
          end: endOfDay(end) 
        })
      );
    }
    
    // Group by date based on filter type
    const grouped: { [key: string]: number } = {};
    
    filteredTransactions.forEach(transaction => {
      let key: string;
      
      switch (filter.type) {
        case 'monthly':
          key = format(transaction.date, 'yyyy-MM');
          break;
        case 'yearly':
          key = format(transaction.date, 'yyyy');
          break;
        default: // daily
          key = format(transaction.date, 'yyyy-MM-dd');
          break;
      }
      
      grouped[key] = (grouped[key] || 0) + transaction.amount;
    });
    
    // Convert to chart format and sort
    return Object.entries(grouped)
      .map(([date, amount]): ChartDataPoint => ({
        date,
        amount,
        label: formatDateLabel(date, filter.type)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, filter]);
  
  const formatDateLabel = (dateStr: string, type: DateFilter['type']): string => {
    switch (type) {
      case 'monthly':
        return format(parseISO(dateStr + '-01'), 'MMM yyyy');
      case 'yearly':
        return dateStr;
      default: // daily
        return format(parseISO(dateStr), 'MMM dd');
    }
  };
  
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="gradient-text">Spending Over Time</CardTitle>
          
          <div className="flex flex-wrap gap-2">
            {(['daily', 'monthly', 'yearly'] as const).map((type) => (
              <Button
                key={type}
                variant={filter.type === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter({ type })}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Spending']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary-glow))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendingChart;