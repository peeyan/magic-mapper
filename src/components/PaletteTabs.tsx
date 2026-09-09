import React from 'react';

export type TabType = 'individual' | 'screen';

type Props = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
};

export const PaletteTabs: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '12px', marginTop: '8px' }}>
      <button
        onClick={() => setActiveTab('individual')}
        style={{
          flex: 1, padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer',
          borderBottom: activeTab === 'individual' ? '2px solid #6366f1' : '2px solid transparent',
          color: activeTab === 'individual' ? '#6366f1' : '#64748b', fontWeight: activeTab === 'individual' ? 'bold' : 'normal', transition: 'all 0.2s'
        }}
      >
        個別ストック
      </button>
      <button
        onClick={() => setActiveTab('screen')}
        style={{
          flex: 1, padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer',
          borderBottom: activeTab === 'screen' ? '2px solid #6366f1' : '2px solid transparent',
          color: activeTab === 'screen' ? '#6366f1' : '#64748b', fontWeight: activeTab === 'screen' ? 'bold' : 'normal', transition: 'all 0.2s'
        }}
      >
        画面キャプチャ
      </button>
    </div>
  );
};