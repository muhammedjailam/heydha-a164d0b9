import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Transaction, VendorSpending } from '@/types/financial';
import { getAllCategories, updateVendorCategory, getVendorCategory } from '@/utils/categoryManager';
import { useToast } from '@/hooks/use-toast';

interface TopVendorsChartProps {
  transactions: Transaction[];
  topN?: number;
  onCategoryUpdate?: (transactionId: string, category: string) => void;
}

const TopVendorsChart = ({ transactions, topN = 10, onCategoryUpdate }: TopVendorsChartProps) => {
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [currentVendor, setCurrentVendor] = useState<{ name: string; transactions: Transaction[] } | null>(null);
  const { toast } = useToast();
  
  const availableCategories = getAllCategories();
  
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
  
  const handleVendorCategoryChange = (vendorName: string, category: string, vendorTransactions: Transaction[]) => {
    if (category === 'ADD_NEW') {
      setCurrentVendor({ name: vendorName, transactions: vendorTransactions });
      setShowNewCategoryModal(true);
      return;
    }
    
    updateVendorCategory(vendorName, category);
    // Update all transactions for this vendor
    vendorTransactions.forEach(transaction => {
      onCategoryUpdate?.(transaction.id, category);
    });
  };
  
  const handleCreateNewCategory = () => {
    if (!newCategoryName.trim() || !currentVendor) return;
    
    // The category will be automatically available after this call
    updateVendorCategory(currentVendor.name, newCategoryName.trim());
    
    // Update all transactions for this vendor
    currentVendor.transactions.forEach(transaction => {
      onCategoryUpdate?.(transaction.id, newCategoryName.trim());
    });
    
    toast({
      title: "Category created",
      description: `"${newCategoryName.trim()}" has been added and applied to ${currentVendor.name}.`
    });
    
    // Reset form state
    setNewCategoryName('');
    setCurrentVendor(null);
    setShowNewCategoryModal(false);
  };
  
  const vendorData = useMemo(() => {
    const expenses = transactions.filter(t => t.isExpense);
    
    // Group by vendor (description) and keep individual transactions
    const vendorTotals: { [vendor: string]: { amount: number; count: number; transactions: Transaction[] } } = {};
    
    expenses.forEach(transaction => {
      const vendor = cleanVendorName(transaction.description);
      if (!vendorTotals[vendor]) {
        vendorTotals[vendor] = { amount: 0, count: 0, transactions: [] };
      }
      vendorTotals[vendor].amount += transaction.amount;
      vendorTotals[vendor].count += 1;
      vendorTotals[vendor].transactions.push(transaction);
    });
    
    // Convert to array and sort by amount
    const vendorArray = Object.entries(vendorTotals)
      .map(([vendor, data]) => ({
        vendor: truncateVendor(vendor),
        fullVendor: vendor,
        amount: data.amount,
        transactions: data.count,
        individualTransactions: data.transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, topN);
      
    return vendorArray;
  }, [transactions, topN, truncateVendor, cleanVendorName]);
  
  const toggleVendorExpansion = (vendor: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendor)) {
        newSet.delete(vendor);
      } else {
        newSet.add(vendor);
      }
      return newSet;
    });
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
    <>
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
                    <TableHead className="text-right font-semibold">Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorData.map((vendor) => {
                    const isExpanded = expandedVendors.has(vendor.fullVendor);
                    return (
                      <>
                        {/* Vendor Summary Row */}
                        <TableRow 
                          key={vendor.vendor}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleVendorExpansion(vendor.fullVendor)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {vendor.vendor}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(vendor.amount)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {vendor.transactions}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={getVendorCategory(vendor.fullVendor) || ''}
                              onValueChange={(value) => handleVendorCategoryChange(vendor.fullVendor, value, vendor.individualTransactions)}
                            >
                              <SelectTrigger className="w-32 bg-background border-border z-50">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border shadow-lg z-50">
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
                          </TableCell>
                        </TableRow>
                        
                        {/* Individual Transaction Rows */}
                        {isExpanded && vendor.individualTransactions.map((transaction) => (
                          <TableRow 
                            key={`${vendor.fullVendor}-${transaction.id}`}
                            className="bg-muted/20 border-l-4 border-l-secondary"
                          >
                            <TableCell className="pl-8 text-sm text-muted-foreground">
                              {format(transaction.date, 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {transaction.category || 'Uncategorized'}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              -
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })}
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
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNewCategory();
                  }
                }}
              />
            </div>
            {currentVendor && (
              <p className="text-sm text-muted-foreground">
                This category will be applied to all transactions from "{currentVendor.name}".
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCategoryModal(false);
                setNewCategoryName('');
                setCurrentVendor(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNewCategory}
              disabled={!newCategoryName.trim()}
            >
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopVendorsChart;