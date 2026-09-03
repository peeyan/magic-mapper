import React from 'react';

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
        style={{ width: '100%', padding: '10px', marginBottom: '12px', background: isHunting ? '#ff4757' : '#2ed573', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        {isHunting ? '🛑 ハンティング終了' : '🎯 テキストをハント！'}
      </button>

      {grabbedText && (
        <div style={{ background: '#ffeaa7', padding: '8px', marginBottom: '12px', borderRadius: '6px', fontSize: '12px', border: '2px dashed #fdcb6e', textAlign: 'center' }}>
          <strong>✋ 掴み中:</strong> {grabbedText.length > 10 ? grabbedText.slice(0, 10) + '...' : grabbedText}<br/>
          <span style={{ fontSize: '10px' }}>入力フォームをクリックしてDrop！</span>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
            <button 
              onClick={() => setGrabbedText(grabbedText.replace(/\s+/g, ''))}
              style={{ background: '#ffffff', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '10px' }}
            >
              🧹 空白・改行削除
            </button>
            <button 
              onClick={() => setGrabbedText(grabbedText.replace(/[^0-9]/g, ''))}
              style={{ background: '#ffffff', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '10px' }}
            >
              🔢 数字抽出
            </button>
          </div>
        </div>
      )}
    </>
  );
};