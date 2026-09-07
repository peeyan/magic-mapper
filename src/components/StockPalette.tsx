import React, { useState, useEffect, useRef } from 'react'; // ★ useRefを追加！
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
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);

  // ★★★ 追加：パレットの正確なサイズを測るセンサー ★★★
  const paletteRef = useRef<HTMLDivElement>(null);
  const [expandedSize, setExpandedSize] = useState({ w: 300, h: 350 });

  // 展開されたりアイテムが増えたりした瞬間に、実際の高さを計測して更新！
  useEffect(() => {
    if (!isMinimized && paletteRef.current) {
      setExpandedSize({
        w: paletteRef.current.offsetWidth,
        h: paletteRef.current.offsetHeight
      });
    }
  }, [isMinimized, stockList.length, grabbedText]);

  // Ctrl+C 自動吸い上げ
  useEffect(() => {
    const handleCopy = () => {
      setTimeout(async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) addStock(text.trim());
        } catch (err) {}
      }, 100);
    };
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [addStock]);

  // 座標同期
  useEffect(() => {
    chrome.storage.local.get(['magicMapper_pos'], (res) => {
      if (res.magicMapper_pos) setPos(res.magicMapper_pos as { x: number; y: number });
    });
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes.magicMapper_pos) {
        setPos(changes.magicMapper_pos.newValue as { x: number; y: number });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // ドラッグ操作（透明シールド方式）
  const handleMinimizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    let currentX = pos.x !== -1 ? pos.x : e.currentTarget.getBoundingClientRect().left;
    let currentY = pos.y !== -1 ? pos.y : e.currentTarget.getBoundingClientRect().top;
    let hasMoved = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 3 || Math.abs(moveEvent.clientY - startY) > 3) hasMoved = true;
      setPos({ x: currentX + (moveEvent.clientX - startX), y: currentY + (moveEvent.clientY - startY) });
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (!hasMoved) {
        setIsMinimized(false);
      } else {
        const finalPos = { x: currentX + (upEvent.clientX - startX), y: currentY + (upEvent.clientY - startY) };
        chrome.storage.local.set({ magicMapper_pos: finalPos });
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handlePaletteMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, li, input')) return; 

    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    let currentX = pos.x !== -1 ? pos.x : e.currentTarget.getBoundingClientRect().left;
    let currentY = pos.y !== -1 ? pos.y : e.currentTarget.getBoundingClientRect().top;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setPos({ x: currentX + (moveEvent.clientX - startX), y: currentY + (moveEvent.clientY - startY) });
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      const finalPos = { x: currentX + (upEvent.clientX - startX), y: currentY + (upEvent.clientY - startY) };
      chrome.storage.local.set({ magicMapper_pos: finalPos });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHunting(false);
        setGrabbedText(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsHunting, setGrabbedText]);

  if (window !== window.top) return null;

  // ★★★ 究極の画面はみ出し防止ロジック ★★★
  // 「今の正確なサイズ」を使って、画面外にはみ出さないように座標を強制補正！
  const currentW = isMinimized ? 48 : expandedSize.w;
  const currentH = isMinimized ? 48 : expandedSize.h;
  const safeX = pos.x !== -1 ? Math.max(0, Math.min(pos.x, window.innerWidth - currentW)) : -1;
  const safeY = pos.y !== -1 ? Math.max(0, Math.min(pos.y, window.innerHeight - currentH)) : -1;

  return (
    <>
      {isDragging && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 2147483646, cursor: 'grabbing'
        }} />
      )}

      {isMinimized ? (
        <div
          onMouseDown={handleMinimizeMouseDown}
          style={{
            position: 'fixed',
            left: safeX !== -1 ? `${safeX}px` : 'auto',
            top: safeY !== -1 ? `${safeY}px` : 'auto',
            right: safeX === -1 ? '24px' : 'auto',
            bottom: safeY === -1 ? '24px' : 'auto',
            width: '48px', height: '48px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
            cursor: isDragging ? 'grabbing' : 'grab', color: '#fff',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2147483647, userSelect: 'none', transition: 'box-shadow 0.2s ease'
          }}
          title="ドラッグで移動 / クリックで開く"
        >
          <Sparkles size={22} />
        </div>
      ) : (
        <div 
          ref={paletteRef} // ★ センサーを取り付け！
          onMouseDown={handlePaletteMouseDown}
          style={{
            position: 'fixed',
            left: safeX !== -1 ? `${safeX}px` : 'auto',
            top: safeY !== -1 ? `${safeY}px` : 'auto',
            right: safeX === -1 ? '24px' : 'auto',
            bottom: safeY === -1 ? '24px' : 'auto',
            width: '300px', // ★ 少し広くして...
            boxSizing: 'border-box', // ★ 余白を含めてピッタリ300pxに固定！
            maxHeight: 'calc(100vh - 48px)', // ★ 画面の高さより絶対に大きくならない！
            overflowY: 'auto', // ★ アイテムが増えたらパレット内をスクロールさせる！
            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '16px',
            padding: '14px', boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
            zIndex: 2147483647, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <PaletteHeader stockCount={stockList.length} onClear={clearStocks} onMinimize={() => setIsMinimized(true)} />
          <ActionArea isHunting={isHunting} setIsHunting={setIsHunting} grabbedText={grabbedText} setGrabbedText={setGrabbedText} />
          <StockList stockList={stockList} grabbedText={grabbedText} setGrabbedText={setGrabbedText} removeStock={removeStock} setIsHunting={setIsHunting} />
        </div>
      )}
    </>
  );
};