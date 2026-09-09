import React, { useState } from 'react';
import { Camera, Trash2, ZoomIn } from 'lucide-react';
import type { SnapshotData } from '../hooks/useSnapshotCapture'; // ★ 型をインポート

// ★ Propsを変更して、複数のデータを受け取れるようにする
type Props = {
  snapshots: SnapshotData[];
  activeUrl: string | null;
  activeSnapshot: SnapshotData | null;
  setActiveUrl: (url: string) => void;
  onCapture: () => void;
  onClear: (url: string) => void;
};

export const ScreenCaptureTab: React.FC<Props> = ({ snapshots, activeUrl, activeSnapshot, setActiveUrl, onCapture, onClear }) => {
  const [zoom, setZoom] = useState(0.6); 
  const [iframeHeight, setIframeHeight] = useState(1080); 

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const doc = e.currentTarget.contentDocument || e.currentTarget.contentWindow?.document;
      if (doc) {
        const realHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 1080);
        setIframeHeight(realHeight);
      }
    } catch (err) {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '440px' }}>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onCapture}
          style={{ flex: 1, padding: '10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
        >
          <Camera size={16} /> 今の画面を保存 / 上書き
        </button>
        {activeSnapshot && (
          <button onClick={() => onClear(activeSnapshot.url)} style={{ padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="このキャプチャを破棄">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* ★★★ 新機能：保存した画面の切り替えメニュー ★★★ */}
      {snapshots.length > 0 && (
        <select 
          value={activeUrl || ''} 
          onChange={(e) => setActiveUrl(e.target.value)}
          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', cursor: 'pointer', background: '#f8fafc', color: '#334155', fontWeight: 'bold' }}
        >
          {snapshots.map(s => (
            // 長すぎるURLは見栄えが悪いので少しカットして表示
            <option key={s.url} value={s.url}>
              {s.title} ({s.url.substring(0, 30)}...)
            </option>
          ))}
        </select>
      )}

      {activeSnapshot ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <ZoomIn size={16} color="#64748b" />
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', minWidth: '40px' }}>{Math.round(zoom * 100)}%</span>
            <input type="range" min="0.3" max="1.5" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ flex: 1, cursor: 'pointer', accentColor: '#6366f1' }} />
          </div>

          <div style={{ flex: 1, borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'auto', background: '#f8fafc' }}>
            <div style={{ zoom: zoom, width: '1024px', height: `${iframeHeight}px` }}>
              <iframe 
                name="magic-mapper-iframe" 
                srcDoc={activeSnapshot.html} // ★ 選択中のHTMLを描画！
                onLoad={handleIframeLoad} 
                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} 
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
          <p style={{ fontSize: '13px', textAlign: 'center', padding: '0 10px', lineHeight: '1.6' }}>カメラボタンを押すと、今の画面が<br/>デザインごとここに保存されます。</p>
        </div>
      )}
    </div>
  );
};