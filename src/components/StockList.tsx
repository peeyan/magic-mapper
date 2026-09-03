import React from 'react';
import { GripVertical, X, Inbox } from 'lucide-react';

type Props = {
  stockList: string[];
  grabbedText: string | null;
  setGrabbedText: (val: string | null) => void;
  removeStock: (index: number) => void;
  setIsHunting: (val: boolean) => void;
};

export const StockList: React.FC<Props> = ({ stockList, grabbedText, setGrabbedText, removeStock, setIsHunting }) => {
  if (stockList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
        <Inbox size={32} style={{ strokeWidth: 1.5, marginBottom: '4px' }} />
        <p style={{ margin: 0, fontSize: '12px' }}>ストックは空です</p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {stockList.map((item, index) => {
        const isSelected = grabbedText === item;
        return (
          <div
            key={index}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => {
              setIsHunting(false);
              setGrabbedText(item);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: isSelected ? '#f0f9ff' : '#f8fafc',
              border: isSelected ? '1px solid #38bdf8' : '1px solid #e2e8f0',
              borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: '#1e293b',
              cursor: 'grab', transition: 'all 0.15s ease',
              boxShadow: isSelected ? '0 2px 8px rgba(56, 189, 248, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <GripVertical size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isSelected) setGrabbedText(null);
                removeStock(index);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};