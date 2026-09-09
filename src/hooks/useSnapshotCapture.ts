import { useState, useEffect } from 'react';

export type SnapshotData = {
  url: string;
  title: string;
  html: string;
};

export const useSnapshotCapture = () => {
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    // 1. 初回ロード時
    chrome.storage.local.get(['magicMapper_snapshots'], (res) => {
      // ★ 神修正：中身が確実に「配列」であるかをチェックし、違えば強制的に [] にする！
      const rawData = res.magicMapper_snapshots;
      const data: SnapshotData[] = Array.isArray(rawData) ? rawData : [];
      
      setSnapshots(data);
      if (data.length > 0) {
        setActiveUrl(data[0].url);
      }
    });

    // 2. 他のタブからのリアルタイム同期
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes.magicMapper_snapshots) {
        // ★ 神修正：ここも絶対に「配列」として扱う！
        const rawNew = changes.magicMapper_snapshots.newValue;
        const newSnapshots: SnapshotData[] = Array.isArray(rawNew) ? rawNew : [];
        
        setSnapshots(newSnapshots);
        
        setActiveUrl(prev => {
          if (prev && !newSnapshots.find(s => s.url === prev)) {
            return newSnapshots.length > 0 ? newSnapshots[0].url : null;
          }
          return prev;
        });
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const captureSnapshot = () => {
    try {
      let targetDoc = document;
      if (window.top && window.top.frames.length > 0) {
        let maxArea = 0;
        for (let i = 0; i < window.top.frames.length; i++) {
          try {
            const f = window.top.frames[i];
            if (f.name === 'magic-mapper-iframe') continue;
            if (f.document.body.tagName.toUpperCase() !== 'FRAMESET') {
              const area = f.innerWidth * f.innerHeight;
              if (area > maxArea) { maxArea = area; targetDoc = f.document; }
            }
          } catch(e){}
        }
      }

      const inputs = targetDoc.querySelectorAll('input, textarea, select');
      inputs.forEach((el: any) => {
        if (el.closest('#magic-mapper-root')) return;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('value', el.value);
          if (el.tagName === 'TEXTAREA') el.textContent = el.value;
        } else if (el.tagName === 'SELECT') {
          const selected = el.options[el.selectedIndex];
          if (selected) selected.setAttribute('selected', 'selected');
        }
      });

      const url = targetDoc.location.href;
      const title = targetDoc.title || '無題のページ';
      const baseTag = `<base href="${url}">`;
      
      const headHtml = targetDoc.head.innerHTML;
      const bodyHtml = targetDoc.body.innerHTML;

      // ★★★ 神修正：html と body の「属性（classやstyle）」を丸ごとコピーする魔法！ ★★★
      const getAttributes = (element: HTMLElement) => {
        return Array.from(element.attributes)
          // エラーの元になるインラインイベント（onload等）だけは除外する
          .filter(attr => !attr.name.toLowerCase().startsWith('on'))
          .map(attr => `${attr.name}="${attr.value}"`)
          .join(' ');
      };
      const htmlAttrs = getAttributes(targetDoc.documentElement);
      const bodyAttrs = getAttributes(targetDoc.body);
      
      // スクリプトの完全除去
      const scriptRegex = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
      const safeHead = headHtml.replace(scriptRegex, '');
      const safeBody = bodyHtml.replace(scriptRegex, '');

      const snapshotHtml = `
        <!DOCTYPE html>
        <!-- 🔽 htmlタグに元の属性（lang="ja"など）を復元！ -->
        <html ${htmlAttrs}>
          <head>
            ${baseTag}
            ${safeHead}
            <style>
              ::-webkit-scrollbar { display: none !important; }
              html, body {
                width: 1024px !important; height: auto !important; min-height: 100vh !important;
                overflow: visible !important; background-color: #fff !important; margin: 0 !important; padding: 0 !important;
              }
              header, nav, *[style*="position: fixed"], *[style*="position:fixed"] { position: absolute !important; }
              a { pointer-events: none; }
            </style>
          </head>
          <!-- 🔽 bodyタグに元の属性（class="top"など）を完全復元！ -->
          <body ${bodyAttrs}>${safeBody}</body>
        </html>
      `;

      const newSnapshot: SnapshotData = { url, title, html: snapshotHtml };

      chrome.storage.local.get(['magicMapper_snapshots'], (res) => {
        const rawData = res.magicMapper_snapshots;
        const currentSnapshots: SnapshotData[] = Array.isArray(rawData) ? rawData : [];
        
        const filtered = currentSnapshots.filter(s => s.url !== url);
        const updated = [newSnapshot, ...filtered];
        
        chrome.storage.local.set({ magicMapper_snapshots: updated });
        setActiveUrl(url); 
      });

    } catch (err) {
      alert('スナップショットの取得に失敗しました。');
    }
  };

  const clearSnapshot = (urlToClear: string) => {
    chrome.storage.local.get(['magicMapper_snapshots'], (res) => {
      // ★ 神修正：ここも絶対に「配列」として扱う！
      const rawData = res.magicMapper_snapshots;
      const currentSnapshots: SnapshotData[] = Array.isArray(rawData) ? rawData : [];
      
      const updated = currentSnapshots.filter(s => s.url !== urlToClear);
      
      chrome.storage.local.set({ magicMapper_snapshots: updated });
      if (activeUrl === urlToClear) {
        setActiveUrl(updated.length > 0 ? updated[0].url : null);
      }
    });
  };

  const activeSnapshot = snapshots.find(s => s.url === activeUrl) || null;

  return { snapshots, activeUrl, setActiveUrl, activeSnapshot, captureSnapshot, clearSnapshot };
};