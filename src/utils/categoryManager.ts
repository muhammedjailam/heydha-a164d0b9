import { CategoryMapping } from '@/types/financial';

const STORAGE_KEY = 'financial-dashboard-categories';

export const DEFAULT_CATEGORIES = [
  'Groceries',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Dining',
  'Bills',
  'Insurance',
  'Education',
  'Travel',
  'Investment',
  'Other'
];

export const saveCategoryMapping = (mapping: CategoryMapping): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch (error) {
    console.error('Failed to save category mapping:', error);
  }
};

export const loadCategoryMapping = (): CategoryMapping => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load category mapping:', error);
    return {};
  }
};

export const getVendorCategory = (description: string): string | undefined => {
  const mapping = loadCategoryMapping();
  
  // Try exact match first
  if (mapping[description]) {
    return mapping[description];
  }
  
  // Try partial matches (case insensitive)
  const lowerDescription = description.toLowerCase();
  for (const [vendor, category] of Object.entries(mapping)) {
    if (lowerDescription.includes(vendor.toLowerCase()) || 
        vendor.toLowerCase().includes(lowerDescription)) {
      return category;
    }
  }
  
  return undefined;
};

export const updateVendorCategory = (vendor: string, category: string): void => {
  const mapping = loadCategoryMapping();
  mapping[vendor] = category;
  saveCategoryMapping(mapping);
};

export const getAllCategories = (): string[] => {
  const mapping = loadCategoryMapping();
  const customCategories = [...new Set(Object.values(mapping))];
  
  // Combine default and custom categories, remove duplicates
  return [...new Set([...DEFAULT_CATEGORIES, ...customCategories])].sort();
};