import React, { useState } from 'react'; // ★ useStateをインポート！
import { useHuntingMode } from './useHuntingMode';
import { useStockStorage } from './useStockStorage';
import { useDropMode } from './useDropMode';

export const StockPalette: React.FC = () => {
  const { stockList, addStock, removeStock, clearStocks } = useStockStorage(); 
  const { isHunting, setIsHunting } = useHuntingMode((text) => {
    addStock(text);
  });
  const { grabbedText, setGrabbedText } = useDropMode();
  
  // ★追加：パレットが最小化されているかどうかの状態
  const [isMinimized, setIsMinimized] = useState(false);

  // ----------------------------------------------------
  // 🔽 最小化モードの時のUI（丸いアイコンだけ表示）
  // ----------------------------------------------------
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)} // クリックで展開！
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '50px', height: '50px', borderRadius: '50%',
          background: '#2ed573', border: '2px solid #fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer',
          fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2147483647, padding: 0
        }}
        title="Magic Mapperを開く"
      >
        ✨
      </button>
    );
  }

  // ----------------------------------------------------
  // 🔼 通常モードの時のUI（今までと同じパレット）
  // ----------------------------------------------------
  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', width: '300px',
      background: '#ffffff', border: '2px solid #333', borderRadius: '12px',
      padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      zIndex: 2147483647, fontFamily: 'sans-serif', color: '#333'
    }}>
      
      {/* 1. ヘッダー部分 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>✨ Magic Mapper</h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* 全消去ボタン */}
          {stockList.length > 0 && (
            <button 
              onClick={clearStocks}
              style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '12px' }}
            >
              全消去
            </button>
          )}
          
          {/* ★追加：最小化ボタン（「ー」アイコン） */}
          <button 
            onClick={() => setIsMinimized(true)} // クリックで最小化！
            style={{ background: '#f1f2f6', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontWeight: 'bold' }}
            title="最小化"
          >
            ー
          </button>
        </div>
      </div>
      
      {/* 2. ハントボタン */}
      <button 
        onClick={() => {
          if (grabbedText) setGrabbedText(null);
          setIsHunting(!isHunting);
        }}
        style={{
          width: '100%', padding: '10px', marginBottom: '12px',
          background: isHunting ? '#ff4757' : '#2ed573', color: 'white',
          border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
        }}
      >
        {isHunting ? '🛑 ハンティング終了' : '🎯 テキストをハント！'}
      </button>

      {/* 3. 掴み中アピールUI */}
      {grabbedText && (
        <div style={{ 
          background: '#ffeaa7', padding: '8px', marginBottom: '12px', 
          borderRadius: '6px', fontSize: '12px', border: '2px dashed #fdcb6e', textAlign: 'center' 
        }}>
          <strong>✋ 掴み中:</strong> {grabbedText.length > 10 ? grabbedText.slice(0, 10) + '...' : grabbedText}<br/>
          <span style={{ fontSize: '10px' }}>入力フォームをクリックしてDrop！</span>
        </div>
      )}

      {/* 4. リスト＆個別削除ボタン */}
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {stockList.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>まだストックがありません</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {stockList.map((item, index) => (
              <li 
                key={index}
                onClick={() => {
                  setIsHunting(false);
                  setGrabbedText(item);
                }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: grabbedText === item ? '#fdcb6e' : '#f1f2f6',
                  padding: '8px', marginBottom: '8px',
                  borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all',
                  cursor: 'grab', border: '1px solid #eee'
                }}
              >
                <span style={{ marginRight: '8px' }}>{item}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (grabbedText === item) setGrabbedText(null);
                    removeStock(index);
                  }}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: '14px', padding: '0 4px', color: '#ff7675'
                  }}
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};