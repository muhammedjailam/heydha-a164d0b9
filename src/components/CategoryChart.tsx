import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Settings, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Transaction, CategoryBreakdown } from '@/types/financial';
import { getVendorCategory, loadCategoryMapping, saveCategoryMapping } from '@/utils/categoryManager';
import { useToast } from '@/hooks/use-toast';
import { useCategories, triggerGlobalCategoryRefresh } from '@/hooks/useCategories';

interface CategoryChartProps {
  transactions: Transaction[];
  onCategoryUpdate?: (transactionId: string, category: string) => void;
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

const CategoryChart = ({ transactions, onCategoryUpdate }: CategoryChartProps) => {
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { categories: availableCategories, refreshCategories } = useCategories();
  const { toast } = useToast();
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
  
  const handleEditCategory = (oldName: string) => {
    setEditingCategory(oldName);
    setNewCategoryName(oldName);
    setShowManageModal(true);
  };
  
  const handleSaveEdit = () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    
    // Update all transactions that use the old category
    transactions.forEach(transaction => {
      if (transaction.category === editingCategory) {
        onCategoryUpdate?.(transaction.id, newCategoryName.trim());
      }
    });
    
    toast({
      title: "Category updated",
      description: `"${editingCategory}" has been renamed to "${newCategoryName.trim()}".`
    });
    
    setEditingCategory(null);
    setNewCategoryName('');
    refreshCategories(); // Refresh the category list
    triggerGlobalCategoryRefresh(); // Refresh all other components
    setShowManageModal(false);
  };
  
  const handleDeleteCategory = (categoryName: string) => {
    // Update all transactions that use this category to "Uncategorized"
    transactions.forEach(transaction => {
      if (transaction.category === categoryName) {
        onCategoryUpdate?.(transaction.id, 'Uncategorized');
      }
    });
    
    // Remove the category from localStorage by updating all vendor mappings
    const mapping = loadCategoryMapping();
    Object.keys(mapping).forEach(vendor => {
      if (mapping[vendor] === categoryName) {
        delete mapping[vendor];
      }
    });
    saveCategoryMapping(mapping);
    
    refreshCategories(); // Refresh the category list
    triggerGlobalCategoryRefresh(); // Refresh all other components
    
    toast({
      title: "Category deleted",
      description: `"${categoryName}" has been deleted. Transactions moved to "Uncategorized".`
    });
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
    <>
      <Card className="financial-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="gradient-text">Expense Breakdown by Category</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshCategories();
                setShowManageModal(true);
              }}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage Categories
            </Button>
          </div>
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
      
      {/* Manage Categories Modal */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          
          {editingCategory ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryName">Category Name</Label>
                <Input
                  id="editCategoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={!newCategoryName.trim()}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-80 overflow-y-auto space-y-2">
                {availableCategories.map((category) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{category}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                      {category !== 'Uncategorized' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {availableCategories.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No categories available
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategoryChart;