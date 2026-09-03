import React from 'react';
import { Sparkles, Trash2, Minus } from 'lucide-react';

type Props = {
  stockCount: number;
  onClear: () => void;
  onMinimize: () => void;
};

export const PaletteHeader: React.FC<Props> = ({ stockCount, onClear, onMinimize }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Sparkles size={16} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', letterSpacing: '-0.3px' }}>コピペしちゃうぞ！</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {stockCount > 0 && (
          <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Trash2 size={12} /> 全消去
          </button>
        )}
        <button onClick={onMinimize} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
};