import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import PrivacyDisclaimer from '@/components/PrivacyDisclaimer';
import FileUpload from '@/components/FileUpload';
import KPICards from '@/components/KPICards';
import SpendingChart from '@/components/SpendingChart';
import CategoryChart from '@/components/CategoryChart';
import TopVendorsChart from '@/components/TopVendorsChart';
import TopVendorsByIncomeChart from '@/components/TopVendorsByIncomeChart';
import TransactionTable from '@/components/TransactionTable';
import { Transaction } from '@/types/financial';
import { parseCSV, getStatementPeriod } from '@/utils/csvParser';
import { getVendorCategory } from '@/utils/categoryManager';
import { exportToPDF } from '@/utils/pdfExport';
const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    toast
  } = useToast();
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const parsedTransactions = await parseCSV(file);

      // Apply automatic categorization
      const categorizedTransactions = parsedTransactions.map(transaction => ({
        ...transaction,
        category: getVendorCategory(transaction.description)
      }));
      setTransactions(categorizedTransactions);
      toast({
        title: "File processed successfully",
        description: `Loaded ${parsedTransactions.length} transactions from your CSV file.`
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: "Please check your CSV format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);
  const handleCategoryUpdate = useCallback((transactionId: string, category: string) => {
    setTransactions(prev => prev.map(t => t.id === transactionId ? {
      ...t,
      category
    } : t));
  }, []);
  const handleExportPDF = useCallback(() => {
    exportToPDF(transactions);
  }, [transactions]);

  // Calculate KPIs
  const totalIncome = transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalIncome - totalExpenses;
  const statementPeriod = getStatementPeriod(transactions);
  const hasData = transactions.length > 0;
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Heydha Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Analyze your bank statements with complete privacy
            </p>
          </div>
          
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            {hasData && <Button onClick={handleExportPDF} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>}
          </div>
        </div>

        {/* Privacy Disclaimer */}
        <PrivacyDisclaimer />

        {/* File Upload or Dashboard */}
        {!hasData ? <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} /> : <div id="dashboard-content" className="space-y-8">
            {/* KPI Cards */}
            <KPICards totalIncome={totalIncome} totalExpenses={totalExpenses} netFlow={netFlow} statementPeriod={statementPeriod} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <SpendingChart transactions={transactions} />
              <CategoryChart transactions={transactions} onCategoryUpdate={handleCategoryUpdate} />
            </div>

            {/* Top Vendors Chart */}
            <TopVendorsChart transactions={transactions} onCategoryUpdate={handleCategoryUpdate} />

            {/* Top Vendors by Income Chart */}
            <TopVendorsByIncomeChart transactions={transactions} />

            {/* Transaction Table */}
            <TransactionTable transactions={transactions} onCategoryUpdate={handleCategoryUpdate} />

            {/* Reset Button */}
            <div className="flex justify-center pt-8">
              <Button onClick={() => setTransactions([])} variant="outline" size="lg">
                Upload New Statement
              </Button>
            </div>
          </div>}
      </div>
    </div>;
};
export default Index;