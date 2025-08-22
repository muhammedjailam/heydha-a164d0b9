import { useState, useEffect, useCallback } from 'react';
import { getAllCategories } from '@/utils/categoryManager';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  
  const refreshCategories = useCallback(() => {
    setCategories(getAllCategories());
  }, []);
  
  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);
  
  return {
    categories,
    refreshCategories
  };
};

// Global category refresh function that can trigger updates across components
let globalRefreshFn: (() => void) | null = null;

export const setGlobalCategoryRefresh = (refreshFn: () => void) => {
  globalRefreshFn = refreshFn;
};

export const triggerGlobalCategoryRefresh = () => {
  if (globalRefreshFn) {
    globalRefreshFn();
  }
};