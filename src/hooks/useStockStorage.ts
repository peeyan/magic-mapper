import { useState, useEffect, useCallback } from 'react';

export const useStockStorage = () => {
  const [stockList, setStockList] = useState<string[]>([]);

  useEffect(() => {
    // ★ガード: 拡張機能の文脈（Context）が生きていない場合は何もしない
    if (!chrome.runtime?.id) return;

    try {
      chrome.storage.local.get(['magicMapperStocks'], (result) => {
        if (chrome.runtime?.lastError) return;
        if (result?.magicMapperStocks) {
          setStockList(result.magicMapperStocks as string[]);
        }
      });
    } catch {
      // Context invalidated 時のキャッチ
    }

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      // ここでも文脈チェック
      if (!chrome.runtime?.id) return;

      if (areaName === 'local' && changes.magicMapperStocks) {
        setStockList((changes.magicMapperStocks.newValue as string[]) || []);
      }
    };

    try {
      chrome.storage.onChanged.addListener(handleStorageChange);
    } catch {
      // Context invalidated 時のキャッチ
    }

    return () => {
      try {
        if (chrome.runtime?.id) {
          chrome.storage.onChanged.removeListener(handleStorageChange);
        }
      } catch {
        // 無視してOK
      }
    };
  }, []);

  const addStock = useCallback((text: string) => {
    if (!chrome.runtime?.id) return;

    setStockList((prev) => {
      const newList = [...prev, text];
      try {
        chrome.storage.local.set({ magicMapperStocks: newList });
      } catch {
        // Context invalidated 時のキャッチ
      }
      return newList;
    });
  }, []);

  const removeStock = useCallback((indexToRemove: number) => {
    if (!chrome.runtime?.id) return;

    setStockList((prev) => {
      const newList = prev.filter((_, index) => index !== indexToRemove);
      try {
        chrome.storage.local.set({ magicMapperStocks: newList });
      } catch {
        // Context invalidated 時のキャッチ
      }
      return newList;
    });
  }, []);

  const clearStocks = useCallback(() => {
    if (!chrome.runtime?.id) return;

    try {
      chrome.storage.local.set({ magicMapperStocks: [] });
    } catch {
      // Context invalidated 時のキャッチ
    }
    setStockList([]);
  }, []);

  return { stockList, addStock, removeStock, clearStocks };
};