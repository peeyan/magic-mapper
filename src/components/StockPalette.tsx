import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useHuntingMode } from '../hooks/useHuntingMode';
import { useStockStorage } from '../hooks/useStockStorage';
import { useDropMode } from '../hooks/useDropMode';
import { PaletteHeader } from './PaletteHeader';
import { ActionArea } from './ActionArea';
import { StockList } from './StockList';

export const StockPalette: React.FC = () => {
  const { stockList, addStock, removeStock, clearStocks } = useStockStorage();
  const { isHunting, setIsHunting } = useHuntingMode((text) => addStock(text));
  const { grabbedText, setGrabbedText } = useDropMode();
  const [isMinimized, setIsMinimized] = useState(true);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '48px', height: '48px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
          boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)', cursor: 'pointer',
          color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2147483647, transition: 'transform 0.2s ease'
        }}
      >
        <Sparkles size={22} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', width: '280px',
      background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '16px',
      padding: '14px', boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      zIndex: 2147483647, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <PaletteHeader stockCount={stockList.length} onClear={clearStocks} onMinimize={() => setIsMinimized(true)} />
      <ActionArea isHunting={isHunting} setIsHunting={setIsHunting} grabbedText={grabbedText} setGrabbedText={setGrabbedText} />
      <StockList stockList={stockList} grabbedText={grabbedText} setGrabbedText={setGrabbedText} removeStock={removeStock} setIsHunting={setIsHunting} />
    </div>
  );
};