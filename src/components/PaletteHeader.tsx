import React from 'react';

// ★親から受け取る関数やデータの型を定義
type Props = {
  stockCount: number;
  onClear: () => void;
  onMinimize: () => void;
};

export const PaletteHeader: React.FC<Props> = ({ stockCount, onClear, onMinimize }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
      <h3 style={{ margin: 0, fontSize: '16px' }}>✨ Magic Mapper</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        {stockCount > 0 && (
          <button onClick={onClear} style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '12px' }}>
            全消去
          </button>
        )}
        <button onClick={onMinimize} style={{ background: '#f1f2f6', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontWeight: 'bold' }}>
          ー
        </button>
      </div>
    </div>
  );
};