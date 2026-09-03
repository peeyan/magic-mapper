import React, { useState } from 'react';
// フックとコンポーネントのインポートパスに注意！
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
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        style={{ position: 'fixed', bottom: '20px', right: '20px', width: '50px', height: '50px', borderRadius: '50%', background: '#2ed573', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer', fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2147483647, padding: 0 }}
      >
        ✨
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '300px', background: '#ffffff', border: '2px solid #333', borderRadius: '12px', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 2147483647, fontFamily: 'sans-serif', color: '#333' }}>
      {/* 組み立てるだけ！可読性が爆上がり！ */}
      <PaletteHeader 
        stockCount={stockList.length} 
        onClear={clearStocks} 
        onMinimize={() => setIsMinimized(true)} 
      />
      
      <ActionArea 
        isHunting={isHunting} 
        setIsHunting={setIsHunting} 
        grabbedText={grabbedText} 
        setGrabbedText={setGrabbedText} 
      />
      
      <StockList 
        stockList={stockList} 
        grabbedText={grabbedText} 
        setGrabbedText={setGrabbedText} 
        removeStock={removeStock} 
        setIsHunting={setIsHunting} 
      />
    </div>
  );
};