import React from 'react';

type Props = {
  stockList: string[];
  grabbedText: string | null;
  setGrabbedText: (val: string | null) => void;
  removeStock: (index: number) => void;
  setIsHunting: (val: boolean) => void;
};

export const StockList: React.FC<Props> = ({ stockList, grabbedText, setGrabbedText, removeStock, setIsHunting }) => {
  if (stockList.length === 0) {
    return <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>まだストックがありません</p>;
  }

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {stockList.map((item, index) => (
          <li 
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
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: grabbedText === item ? '#fdcb6e' : '#f1f2f6', padding: '8px', marginBottom: '8px', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all', cursor: 'grab', border: '1px solid #eee' }}
          >
            <span style={{ marginRight: '8px' }}>{item}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (grabbedText === item) setGrabbedText(null);
                removeStock(index);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 4px', color: '#ff7675' }}
            >
              ✖
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};