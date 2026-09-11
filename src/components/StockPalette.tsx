import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useHuntingMode } from '../hooks/useHuntingMode';
import { useStockStorage } from '../hooks/useStockStorage';
import { useDropMode } from '../hooks/useDropMode';
import { useClipboardStock } from '../hooks/useClipboardStock';
import { useSnapshotCapture } from '../hooks/useSnapshotCapture';
import { PaletteHeader } from './PaletteHeader';
import { ActionArea } from './ActionArea';
import { StockList } from './StockList';
import { PaletteTabs, type TabType } from './PaletteTabs';
import { ScreenCaptureTab } from './ScreenCaptureTab';

export const StockPalette: React.FC = () => {
  const { stockList, addStock, removeStock, clearStocks } = useStockStorage();
  const { isHunting, setIsHunting } = useHuntingMode((text) => addStock(text));
  const { grabbedText, setGrabbedText } = useDropMode();
  const [isMinimized, setIsMinimized] = useState(true);
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('individual');

  // ★ 分離したカスタムフックを呼び出すだけ！
  useClipboardStock(addStock, activeTab === 'individual');
  const { snapshots, activeUrl, activeSnapshot, setActiveUrl, captureSnapshot, clearSnapshot } = useSnapshotCapture();

  const paletteRef = useRef<HTMLDivElement>(null);
  const [expandedSize, setExpandedSize] = useState({ w: 340, h: 480 });

  useEffect(() => {
    if (!isMinimized && paletteRef.current) {
      setExpandedSize({ w: paletteRef.current.offsetWidth, h: paletteRef.current.offsetHeight });
    }
  }, [isMinimized, stockList.length, grabbedText, activeTab]);

  useEffect(() => {
    const savedPos = sessionStorage.getItem('magicMapper_pos');
    if (savedPos) { try { setPos(JSON.parse(savedPos)); } catch(e) {} }
  }, []);

  // ドラッグロジック
  const handleMinimizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX, startY = e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    let currentX = rect.left, currentY = rect.top, hasMoved = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 3 || Math.abs(moveEvent.clientY - startY) > 3) hasMoved = true;
      setPos({ x: currentX + (moveEvent.clientX - startX), y: currentY + (moveEvent.clientY - startY) });
    };
    const onMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (!hasMoved) setIsMinimized(false);
      else sessionStorage.setItem('magicMapper_pos', JSON.stringify({ x: currentX + (upEvent.clientX - startX), y: currentY + (upEvent.clientY - startY) }));
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handlePaletteMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, li, input, textarea, iframe, select')) return;

    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX, startY = e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    let currentX = rect.left, currentY = rect.top;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setPos({ x: currentX + (moveEvent.clientX - startX), y: currentY + (moveEvent.clientY - startY) });
    };
    const onMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      sessionStorage.setItem('magicMapper_pos', JSON.stringify({ x: currentX + (upEvent.clientX - startX), y: currentY + (upEvent.clientY - startY) }));
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsHunting(false); setGrabbedText(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsHunting, setGrabbedText]);

  if (window !== window.top) return null;

  const currentW = isMinimized ? 48 : expandedSize.w;
  const currentH = isMinimized ? 48 : expandedSize.h;
  const safeX = pos.x !== -1 ? Math.max(0, Math.min(pos.x, window.innerWidth - currentW)) : -1;
  const safeY = pos.y !== -1 ? Math.max(0, Math.min(pos.y, window.innerHeight - currentH)) : -1;

  return (
    <>
      {isDragging && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483646, cursor: 'grabbing' }} />}

      {isMinimized ? (
        <div
          onMouseDown={handleMinimizeMouseDown}
          style={{
            position: 'fixed', left: safeX !== -1 ? `${safeX}px` : 'auto', top: safeY !== -1 ? `${safeY}px` : 'auto',
            right: safeX === -1 ? '24px' : 'auto', bottom: safeY === -1 ? '24px' : 'auto',
            width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)', cursor: isDragging ? 'grabbing' : 'grab', color: '#fff',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2147483647, userSelect: 'none',
          }}
        >
          <Sparkles size={22} />
        </div>
      ) : (
        <div
          ref={paletteRef}
          onMouseDown={handlePaletteMouseDown}
          style={{
            position: 'fixed', left: safeX !== -1 ? `${safeX}px` : 'auto', top: safeY !== -1 ? `${safeY}px` : 'auto',
            right: safeX === -1 ? '24px' : 'auto', bottom: safeY === -1 ? '24px' : 'auto',
            width: '340px', boxSizing: 'border-box', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '16px',
            padding: '14px', boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
            zIndex: 2147483647, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', flexDirection: 'column'
          }}
        >
          <PaletteHeader stockCount={stockList.length} onClear={clearStocks} onMinimize={() => setIsMinimized(true)} />

          {/* ★ 分離したタブボタンコンポーネント */}
          <PaletteTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === 'individual' ? (
          <>
            <ActionArea isHunting={isHunting} setIsHunting={setIsHunting} grabbedText={grabbedText} setGrabbedText={setGrabbedText} />
            <StockList stockList={stockList} grabbedText={grabbedText} setGrabbedText={setGrabbedText} removeStock={removeStock} setIsHunting={setIsHunting} />
          </>
        ) : (
          <ScreenCaptureTab
            snapshots={snapshots}
            activeUrl={activeUrl}
            activeSnapshot={activeSnapshot}
            setActiveUrl={setActiveUrl}
            onCapture={captureSnapshot}
            onClear={clearSnapshot}
            setGrabbedText={setGrabbedText}
          />
        )}
        </div>
      )}
    </>
  );
};