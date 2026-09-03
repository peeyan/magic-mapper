import { useState, useEffect, useCallback } from 'react';

export const useStockStorage = () => {
  const [stockList, setStockList] = useState<string[]>([]);

  // 1. 最初パレットが開いた時に、四次元ポケット（Storage）からデータを取り出す
  useEffect(() => {
    chrome.storage.local.get(['magicMapperStocks'], (result:any) => {
      if (result.magicMapperStocks) {
        setStockList(result.magicMapperStocks as string[]);
      }
    });

    // 2. 別のタブでデータが更新されたら、今のタブのパレットもリアルタイムで更新する（超重要！）
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.magicMapperStocks) {
        setStockList(changes.magicMapperStocks.newValue as string[] || []);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 3. テキストを追加して、四次元ポケットに保存する関数
  const addStock = useCallback((text: string) => {
    setStockList((prev) => {
      const newList = [...prev, text];
      // Chrome Storageに保存！（これでリロードしても消えない）
      chrome.storage.local.set({ magicMapperStocks: newList });
      return newList;
    });
  }, []);

  // ★指定したアイテム（インデックス）を削除する関数
  const removeStock = useCallback((indexToRemove: number) => {
    setStockList((prev) => {
      // 指定した番号以外のものを残す（＝指定したものを消す）
      const newList = prev.filter((_, index) => index !== indexToRemove);
      chrome.storage.local.set({ magicMapperStocks: newList }); // Storageも更新！
      return newList;
    });
  }, []);

  // ★一気に全部消す関数
  const clearStocks = useCallback(() => {
    chrome.storage.local.set({ magicMapperStocks: [] });
    setStockList([]);
  }, []);

  // ★忘れずに return に追加！
  return { stockList, addStock, removeStock, clearStocks };
};