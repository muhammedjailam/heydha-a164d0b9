import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Transaction } from '@/types/financial';
import { updateVendorCategory, getVendorCategory } from '@/utils/categoryManager';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useCategories, setGlobalCategoryRefresh } from '@/hooks/useCategories';

interface TransactionTableProps {
  transactions: Transaction[];
  onCategoryUpdate: (transactionId: string, category: string) => void;
}

interface GroupedTransactions {
  [date: string]: {
    transactions: Transaction[];
    totalExpenses: number;
    totalIncome: number;
  };
}

const TransactionTable = ({ transactions, onCategoryUpdate }: TransactionTableProps) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const { categories: availableCategories, refreshCategories } = useCategories();
  const { toast } = useToast();
  
  // Set this component's refresh function for global updates
  setGlobalCategoryRefresh(refreshCategories);
  
  const cleanVendorName = (description: string): string => {
    // Remove =" and extra quotes and clean up the description
    return description
      .replace(/^="|"$/g, '') // Remove =" at start and " at end
      .replace(/^""|""$/g, '') // Remove double quotes
      .replace(/^"|"$/g, '')   // Remove single quotes
      .trim();
  };
  
  const groupedTransactions = useMemo(() => {
    const grouped: GroupedTransactions = {};
    
    transactions.forEach(transaction => {
      const dateKey = format(transaction.date, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          transactions: [],
          totalExpenses: 0,
          totalIncome: 0
        };
      }
      
      grouped[dateKey].transactions.push(transaction);
      if (transaction.isExpense) {
        grouped[dateKey].totalExpenses += transaction.amount;
      } else {
        grouped[dateKey].totalIncome += transaction.amount;
      }
    });
    
    return grouped;
  }, [transactions]);
  
  const sortedDates = useMemo(() => {
    return Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));
  }, [groupedTransactions]);
  
  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };
  
  const handleCategoryChange = (transaction: Transaction, category: string) => {
    if (category === 'ADD_NEW') {
      setCurrentTransaction(transaction);
      setShowNewCategoryModal(true);
      return;
    }
    
    updateVendorCategory(cleanVendorName(transaction.description), category);
    onCategoryUpdate(transaction.id, category);
  };
  
  const handleAddNewCategory = () => {
    if (!newCategory.trim() || !currentTransaction) return;
    
    const cleanedVendor = cleanVendorName(currentTransaction.description);
    updateVendorCategory(cleanedVendor, newCategory.trim());
    onCategoryUpdate(currentTransaction.id, newCategory.trim());
    
    toast({
      title: "Category created",
      description: `"${newCategory.trim()}" has been added and applied to ${cleanedVendor}.`
    });
    
    // Reset form state
    setNewCategory('');
    setCurrentTransaction(null);
    setShowNewCategoryModal(false);
  };
  
  const formatCurrency = (amount: number) => {
    return `MVR ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <>
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="gradient-text">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedDates.map(date => {
              const dayData = groupedTransactions[date];
              const isExpanded = expandedDates.has(date);
              
              return (
                <div key={date} className="border border-border/50 rounded-lg overflow-hidden">
                  {/* Date Header */}
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                    onClick={() => toggleDateExpansion(date)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">{formatDate(date)}</span>
                      <span className="text-sm text-muted-foreground">
                        {dayData.transactions.length} transaction{dayData.transactions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="text-right space-y-1">
                      {dayData.totalExpenses > 0 && (
                        <div className="text-expense font-semibold">
                          -{formatCurrency(dayData.totalExpenses)}
                        </div>
                      )}
                      {dayData.totalIncome > 0 && (
                        <div className="text-green-600 font-semibold">
                          +{formatCurrency(dayData.totalIncome)}
                        </div>
                      )}
                    </div>
                  </Button>
                  
                  {/* Expanded Transactions */}
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/20">
                      {dayData.transactions.map((transaction, index) => (
                        <div
                          key={transaction.id}
                          className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                            index < dayData.transactions.length - 1 ? 'border-b border-border/30' : ''
                          }`}
                        >
                          {/* Transaction Details */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {cleanVendorName(transaction.description)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.isExpense ? 'Expense' : 'Income'}
                            </div>
                          </div>
                          
                          {/* Amount */}
                          <div className="text-right sm:w-24">
                            <div className={`font-semibold ${
                              transaction.isExpense ? 'text-expense' : 'text-income'
                            }`}>
                              {transaction.isExpense ? '-' : '+'}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                          
                          {/* Category Selector (only for expenses) */}
                          {transaction.isExpense && (
                            <div className="sm:w-48">
                              <Select
                                value={transaction.category || getVendorCategory(transaction.description) || ''}
                                onValueChange={(value) => handleCategoryChange(transaction, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCategories.map(category => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="ADD_NEW">
                                    + Add New Category
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {transactions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No transactions to display
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* New Category Modal */}
      <Dialog open={showNewCategoryModal} onOpenChange={setShowNewCategoryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewCategory();
                  }
                }}
              />
            </div>
            {currentTransaction && (
              <p className="text-sm text-muted-foreground">
                This category will be applied to "{cleanVendorName(currentTransaction.description)}".
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCategoryModal(false);
                setNewCategory('');
                setCurrentTransaction(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNewCategory}
              disabled={!newCategory.trim()}
            >
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionTable;