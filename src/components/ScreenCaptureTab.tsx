import React, { useState } from 'react';
import { Camera, Trash2, ZoomIn, Copy, ExternalLink } from 'lucide-react';
import type { SnapshotData } from '../hooks/useSnapshotCapture';

type Props = {
  snapshots: SnapshotData[];
  activeUrl: string | null;
  activeSnapshot: SnapshotData | null;
  setActiveUrl: (url: string) => void;
  onCapture: () => void;
  onClear: (url: string) => void;
  setGrabbedText: (text: string | null) => void;
};

export const ScreenCaptureTab: React.FC<Props> = ({ snapshots, activeUrl, activeSnapshot, setActiveUrl, onCapture, onClear, setGrabbedText }) => {
  const [zoom, setZoom] = useState(0.55); 
  const [iframeHeight, setIframeHeight] = useState(1080); 

  // ★ 追加：現在ストックしているURLをクリップボードにコピー＆セルに入力
  const handleCopyUrl = () => {
    if (activeSnapshot) {
      navigator.clipboard.writeText(activeSnapshot.url);
      setGrabbedText(activeSnapshot.url);
    }
  };

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const iframe = e.currentTarget;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const realHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 1080);
        setIframeHeight(realHeight);

        // ★ 先手の神修正：現在のURLを見て、Gmail（mail.google.com）かどうかを判定！
        const isGmail = activeSnapshot?.url.includes('mail.google.com');

        const attachSmartPicker = (targetDoc: Document) => {
          // 1. 魔法のCSSクラス注入
          if (!targetDoc.getElementById('magic-mapper-picker-style')) {
            const style = targetDoc.createElement('style');
            style.id = 'magic-mapper-picker-style';
            style.innerHTML = `
              .magic-mapper-hover {
                outline: 2px dashed #6366f1 !important;
                background-color: rgba(99, 102, 241, 0.15) !important;
                cursor: grab !important;
                border-radius: 2px !important;
              }
              .magic-mapper-flash { background-color: rgba(168, 85, 247, 0.5) !important; transition: background-color 0.2s !important; }
              ${isGmail ? '.magic-mapper-text-wrapper { display: inline; }' : ''}
            `;
            targetDoc.head.appendChild(style);
          }

          // ★ 2. Gmailの時だけ、テキストノードの分離（ラッピング）を実行する！
          if (isGmail) {
            const wrapTextNodes = (bodyElement: HTMLElement) => {
              // TreeWalkerでテキストノードのみを抽出
              const walker = document.createTreeWalker(
                bodyElement,
                NodeFilter.SHOW_TEXT,
                {
                  acceptNode: (node) => {
                    const parent = node.parentNode as HTMLElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    // 絶対にラップしてはいけない非表示タグ・機能タグを除外
                    const ignoreTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'OPTION', 'IFRAME'];
                    if (ignoreTags.includes(parent.nodeName)) {
                      return NodeFilter.FILTER_REJECT;
                    }
                    // 空白・改行のみのテキストノードは除外
                    if (!node.nodeValue || node.nodeValue.trim() === '') {
                      return NodeFilter.FILTER_REJECT;
                    }
                    // Aタグは明示的に許可（これがないと弾かれるケースがある）
                    return NodeFilter.FILTER_ACCEPT;
                  }
                }
              );

              const nodesToWrap: Node[] = [];
              let currentNode = walker.nextNode();
              while (currentNode) {
                nodesToWrap.push(currentNode);
                currentNode = walker.nextNode();
              }
              // 抽出したテキストノードを透明なspanで包む
              nodesToWrap.forEach((node) => {
                const wrapper = document.createElement('span');
                wrapper.className = 'magic-mapper-text-wrapper';
                // Aタグの中でラップされた場合でも、元サイトのレイアウト・デザインを継承させるための防御的CSS
                wrapper.style.display = 'inline';
                wrapper.style.color = 'inherit';
                wrapper.style.textDecoration = 'inherit';

                node.parentNode?.insertBefore(wrapper, node);
                wrapper.appendChild(node);
              });
            };
            wrapTextNodes(targetDoc.body);
          }

          // 3. 安全なclass付け外しによるホバー処理
          targetDoc.body.onmouseover = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement;
            if (target.tagName !== 'BODY' && target.tagName !== 'HTML') {
              target.classList.add('magic-mapper-hover');
            }
          };

          targetDoc.body.onmouseout = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement;
            target.classList.remove('magic-mapper-hover');
          };

          // 4. クリックで掴む処理
          targetDoc.addEventListener('click', (ev: MouseEvent) => {
            const target = ev.target as HTMLElement;
            if (target.tagName === 'BODY' || target.tagName === 'HTML') return;
            // aタグの遷移など、デフォルトの挙動を最優先で完全にブロック
            ev.preventDefault();
            ev.stopPropagation();

            let text = (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
              ? (target as HTMLInputElement).value
              : target.innerText;
            text = text ? text.trim() : '';

            if (text) {
              setGrabbedText(text);
              target.classList.remove('magic-mapper-hover');
              target.classList.add('magic-mapper-flash');
              setTimeout(() => { target.classList.remove('magic-mapper-flash'); }, 200);
            }
          }, true);
        };

        // メイン画面に魔法をかける
        attachSmartPicker(doc);

        // 分割画面（iframe内）にも漏れなく魔法をかける
        doc.querySelectorAll('iframe').forEach(innerIfr => {
          try {
            const innerDoc = innerIfr.contentDocument || innerIfr.contentWindow?.document;
            if (innerDoc) attachSmartPicker(innerDoc);
            innerIfr.addEventListener('load', () => {
              const idoc = innerIfr.contentDocument || innerIfr.contentWindow?.document;
              if (idoc) attachSmartPicker(idoc);
            });
          } catch (err) {}
        });
      }
    } catch (err) {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '440px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        
        {/* ★ 重たい「画面保存」ボタン */}
        <button
          onClick={onCapture}
          style={{ flex: 1, padding: '10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          title="デザインごと画面を保存（少し時間がかかります）"
        >
          <Camera size={16} /> 画面ごと保存
        </button>
        {activeSnapshot && (
          <button onClick={() => onClear(activeSnapshot.url)} style={{ padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="このキャプチャを破棄">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {snapshots.length > 0 && (
        <select 
          value={activeUrl || ''} 
          onChange={(e) => setActiveUrl(e.target.value)}
          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', cursor: 'pointer', background: '#f8fafc', color: '#334155', fontWeight: 'bold' }}
        >
          {snapshots.map(s => (
            <option key={s.url} value={s.url}>{s.title} ({s.url.substring(0, 30)}...)</option>
          ))}
        </select>
      )}

      {activeSnapshot ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <ZoomIn size={16} color="#64748b" />
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', minWidth: '40px' }}>{Math.round(zoom * 100)}%</span>
            <input type="range" min="0.3" max="1.5" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ flex: 1, cursor: 'pointer', accentColor: '#6366f1' }} />
            
            {/* ★ 追加：URLのコピー＆別タブで開くアクションバー */}
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', borderLeft: '1px solid #cbd5e1', paddingLeft: '10px' }}>
              <button 
                onClick={handleCopyUrl} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                title="この画面のURLをコピーして掴む"
              >
                <Copy size={16} />
              </button>
              <a 
                href={activeSnapshot.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}
                title="元のページを別タブで開く"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div style={{ flex: 1, borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'auto', background: '#f8fafc' }}>
            <div style={{ zoom: zoom, width: '1024px', height: `${iframeHeight}px` }}>
              <iframe 
                name="magic-mapper-iframe" 
                srcDoc={activeSnapshot.html}
                onLoad={handleIframeLoad} 
                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} 
                sandbox="allow-same-origin allow-scripts" 
              />
            </div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
          <p style={{ fontSize: '13px', textAlign: 'center', padding: '0 10px', lineHeight: '1.6' }}>上部のボタンから、今の画面またはURLを保存してください。</p>
        </div>
      )}
    </div>
  );
};