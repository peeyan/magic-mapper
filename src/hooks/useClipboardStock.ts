import { useEffect } from 'react';
import { parseSpreadsheetData } from '../utils/spreadsheetParser';

export const useClipboardStock = (addStock: (text: string) => void, isActive: boolean) => {
  useEffect(() => {
    if (!isActive) return;

    const handleCopy = () => {
      setTimeout(async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) {
            const cellValues = parseSpreadsheetData(text);
            let delay = 0;
            cellValues.forEach((val) => {
              setTimeout(() => addStock(val), delay);
              delay += 50;
            });
          }
        } catch (err) {}
      }, 100);
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [addStock, isActive]);
};