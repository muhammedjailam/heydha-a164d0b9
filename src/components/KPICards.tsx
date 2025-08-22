import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KPICardsProps {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  statementPeriod: {
    start: string;
    end: string;
  };
}

const KPICards = ({ totalIncome, totalExpenses, netFlow, statementPeriod }: KPICardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Total Income */}
      <Card className="financial-card group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          <div className="p-2 bg-success/10 rounded-full group-hover:bg-success/20 transition-colors">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-income">{formatCurrency(totalIncome)}</div>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card className="financial-card group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          <div className="p-2 bg-destructive/10 rounded-full group-hover:bg-destructive/20 transition-colors">
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-expense">{formatCurrency(totalExpenses)}</div>
        </CardContent>
      </Card>

      {/* Net Flow */}
      <Card className="financial-card group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net Flow</CardTitle>
          <div className={`p-2 rounded-full transition-colors ${
            netFlow >= 0 
              ? 'bg-success/10 group-hover:bg-success/20' 
              : 'bg-destructive/10 group-hover:bg-destructive/20'
          }`}>
            <DollarSign className={`h-4 w-4 ${netFlow >= 0 ? 'text-success' : 'text-destructive'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-income' : 'text-expense'}`}>
            {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
          </div>
        </CardContent>
      </Card>

      {/* Statement Period */}
      <Card className="financial-card group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Statement Period</CardTitle>
          <div className="p-2 bg-secondary/10 rounded-full group-hover:bg-secondary/20 transition-colors">
            <Calendar className="h-4 w-4 text-secondary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-semibold">
            <div>{statementPeriod.start}</div>
            <div className="text-muted-foreground">to {statementPeriod.end}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPICards;