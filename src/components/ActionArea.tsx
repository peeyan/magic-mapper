import React from 'react';
import { Crosshair, SquareActivity, Eraser, Hash, X } from 'lucide-react'; // ★ X を追加！

type Props = {
  isHunting: boolean;
  setIsHunting: (val: boolean) => void;
  grabbedText: string | null;
  setGrabbedText: (val: string | null) => void;
};

export const ActionArea: React.FC<Props> = ({ isHunting, setIsHunting, grabbedText, setGrabbedText }) => {
  return (
    <>
      <button
        onClick={() => {
          if (grabbedText) setGrabbedText(null);
          setIsHunting(!isHunting);
        }}
        style={{
          width: '100%', padding: '10px 14px', marginBottom: '12px',
          background: isHunting ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: isHunting ? '0 4px 12px rgba(244, 63, 94, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)',
          transition: 'all 0.2s ease'
        }}
      >
        {isHunting ? <SquareActivity size={16} /> : <Crosshair size={16} />}
        {isHunting ? 'ストック停止' : 'テキストをストックする'}
      </button>

      {grabbedText && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', marginBottom: '12px', borderRadius: '10px', fontSize: '12px' }}>

          {/* ★ここを修正：ヘッダー部分に解除（✖）ボタンを設置！ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: '600' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
              ホールド中
            </div>
            <button
              onClick={() => setGrabbedText(null)}
              style={{ background: 'transparent', border: 'none', color: '#15803d', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              title="ホールド解除 (Esc)"
            >
              <X size={14} />
            </button>
          </div>

          <p style={{ margin: '0 0 8px 0', color: '#15803d', wordBreak: 'break-all', fontWeight: '500' }}>
            "{grabbedText.length > 25 ? grabbedText.slice(0, 25) + '...' : grabbedText}"
          </p>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setGrabbedText(grabbedText.replace(/\s+/g, ''))}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', padding: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '500' }}
            >
              <Eraser size={11} /> 空白除去
            </button>
            <button
              onClick={() => setGrabbedText(grabbedText.replace(/[^0-9]/g, ''))}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', padding: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '500' }}
            >
              <Hash size={11} /> 数字抽出
            </button>
          </div>
        </div>
      )}
    </>
  );
};