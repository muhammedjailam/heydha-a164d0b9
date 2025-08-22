import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, CategoryBreakdown } from '@/types/financial';
import { getVendorCategory } from '@/utils/categoryManager';

interface CategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
  'hsl(160 84% 39%)',   // Primary green
  'hsl(217 91% 60%)',   // Secondary blue
  'hsl(38 92% 50%)',    // Warning yellow
  'hsl(0 84% 60%)',     // Destructive red
  'hsl(142 76% 36%)',   // Success green
  'hsl(270 95% 75%)',   // Purple
  'hsl(24 95% 53%)',    // Orange
  'hsl(195 95% 60%)',   // Cyan
  'hsl(295 95% 70%)',   // Pink
  'hsl(45 95% 55%)',    // Gold
];

const CategoryChart = ({ transactions }: CategoryChartProps) => {
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.isExpense);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    if (totalExpenses === 0) return [];
    
    // Group by category
    const categoryTotals: { [category: string]: number } = {};
    
    expenses.forEach(transaction => {
      const category = transaction.category || getVendorCategory(transaction.description) || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
    });
    
    // Convert to chart format
    const breakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount);
      
    return breakdown;
  }, [transactions]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="gradient-text">Expense Breakdown by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {categoryData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ category, percentage }) => 
                    percentage > 5 ? `${category} (${percentage.toFixed(0)}%)` : ''
                  }
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {categoryData.slice(0, 8).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.category}</span>
                  <span className="text-muted-foreground ml-auto">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No expense data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryChart;