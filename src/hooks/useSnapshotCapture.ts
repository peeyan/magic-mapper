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
    chrome.storage.local.get(['magicMapper_snapshots'], (res) => {
      const rawData = res.magicMapper_snapshots;
      const data: SnapshotData[] = Array.isArray(rawData) ? rawData : [];
      setSnapshots(data);
      if (data.length > 0) setActiveUrl(data[0].url);
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes.magicMapper_snapshots) {
        const rawNew = changes.magicMapper_snapshots.newValue;
        const newSnapshots: SnapshotData[] = Array.isArray(rawNew) ? rawNew : [];
        setSnapshots(newSnapshots);
        setActiveUrl(prev => {
          if (!prev && newSnapshots.length > 0) return newSnapshots[0].url;
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

  const captureSnapshot = async () => {
    try {
      const topDoc = window.top?.document || document;
      const url = topDoc.location.href;
      const title = topDoc.title || '無題のページ';

      const getAttributes = (element: Element | null) => {
        if (!element) return '';
        return Array.from(element.attributes)
          .filter(attr => !attr.name.toLowerCase().startsWith('on'))
          .map(attr => `${attr.name}="${attr.value}"`)
          .join(' ');
      };

      const bakeCSS = async (doc: Document) => {
        let cssText = '';
        const processSheet = async (sheet: CSSStyleSheet) => {
          let sheetCss = '';
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              for (const rule of Array.from(rules)) {
                if (rule instanceof CSSImportRule && rule.styleSheet) {
                  sheetCss += await processSheet(rule.styleSheet as CSSStyleSheet);
                } else {
                  sheetCss += rule.cssText + '\n';
                }
              }
            }
          } catch(e) {
            if (sheet.href) {
              try {
                const res = await fetch(sheet.href, { credentials: 'include' });
                const text = await res.text();
                sheetCss += text + '\n';
              } catch(err) {}
            }
          }
          return sheetCss;
        };

        const sheets = Array.from(doc.styleSheets);
        for (const sheet of sheets) {
          let sheetCss = await processSheet(sheet);
          if (sheetCss) {
            const baseUrl = sheet.href || doc.baseURI || url;
            sheetCss = sheetCss.replace(/url\(\s*['"]?(.*?)['"]?\s*\)/gi, (match, path) => {
              if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return match;
              try { return `url("${new URL(path, baseUrl).href}")`; } catch(err) { return match; }
            });
            cssText += sheetCss + '\n';
          }
        }
        return `<style>${cssText}</style>`;
      };

      const sanitizeHtml = (html: string) => {
        let clean = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        clean = clean.replace(/(<(iframe|frame)\b[^>]*?)\bsrc\s*=/gi, '$1data-disabled-src=');
        clean = clean.replace(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*>/gi, '');
        // ★ 神修正（再復活）：絶対に <link rel="stylesheet"> は消さない！Kintoneの命綱！
        return clean;
      };

      // ★ Kintoneのレイアウトを妨害する body への強制 width / margin リセットも完全削除。
      // これで Kintone の Flexbox や Grid は本来の計算通りに美しく配置されます。
      const getBaseStyles = () => `
        <style>
          ::-webkit-scrollbar { display: none !important; }
          a { pointer-events: none !important; }
          .fade-in { opacity: 1 !important; visibility: visible !important; animation: none !important; transition: none !important; }
        </style>
      `;

      const freezeDocument = async (doc: Document) => {
        doc.querySelectorAll('input, textarea, select').forEach((el: any) => {
          if (el.closest('#magic-mapper-root')) return;
          try {
            if (el.tagName === 'INPUT') {
              if (el.type === 'checkbox' || el.type === 'radio') {
                if (el.checked) el.setAttribute('checked', 'checked');
              } else {
                el.setAttribute('value', el.value);
              }
            } else if (el.tagName === 'TEXTAREA') {
              el.setAttribute('value', el.value);
              el.textContent = el.value;
            } else if (el.tagName === 'SELECT') {
              const selected = el.options[el.selectedIndex];
              if (selected) selected.setAttribute('selected', 'selected');
            }
          } catch(e) {}
        });

        const htmlClone = doc.documentElement.cloneNode(true) as HTMLElement;
        const origIframes = doc.querySelectorAll('iframe, frame');
        const cloneIframes = htmlClone.querySelectorAll('iframe, frame');
        
        for (let i = 0; i < origIframes.length; i++) {
          const orig = origIframes[i];
          const clonedIfr = cloneIframes[i] as HTMLElement;
          if (!clonedIfr) continue;
          
          try {
            const innerDoc = (orig as HTMLIFrameElement).contentDocument || (orig as HTMLIFrameElement).contentWindow?.document;
            if (innerDoc) {
              innerDoc.querySelectorAll('input, textarea, select').forEach((el: any) => {
                try {
                  if (el.tagName === 'INPUT') {
                    if (el.type === 'checkbox' || el.type === 'radio') {
                      if (el.checked) el.setAttribute('checked', 'checked');
                    } else {
                      el.setAttribute('value', el.value);
                    }
                  } else if (el.tagName === 'TEXTAREA') {
                    el.setAttribute('value', el.value);
                    el.textContent = el.value;
                  } else if (el.tagName === 'SELECT') {
                    const selected = el.options[el.selectedIndex];
                    if (selected) selected.setAttribute('selected', 'selected');
                  }
                } catch(e){}
              });
              
              const innerBakedCSS = await bakeCSS(innerDoc);
              const innerHead = innerDoc.head ? sanitizeHtml(innerDoc.head.innerHTML) : '';
              const innerBody = innerDoc.body ? sanitizeHtml(innerDoc.body.innerHTML) : '';
              const innerHtmlAttrs = getAttributes(innerDoc.documentElement);
              const innerBodyAttrs = innerDoc.body ? getAttributes(innerDoc.body) : '';
              const innerBaseTag = `<base href="${innerDoc.location?.href || url}">`;

              const innerBaseStyles = `
                <style>
                  ::-webkit-scrollbar { display: none !important; }
                  a { pointer-events: none !important; }
                </style>
              `;

              const innerHtml = `
                <!DOCTYPE html>
                <html ${innerHtmlAttrs}>
                  <head>${innerBaseTag}${innerHead}${innerBakedCSS}${innerBaseStyles}</head>
                  <body ${innerBodyAttrs}>${innerBody}</body>
                </html>
              `;
              
              clonedIfr.removeAttribute('src'); 
              clonedIfr.setAttribute('srcdoc', innerHtml); 
            } else {
              clonedIfr.removeAttribute('src');
            }
          } catch(e) {
            clonedIfr.removeAttribute('src');
          }
        }

        htmlClone.querySelectorAll('script').forEach(s => s.remove());
        htmlClone.querySelectorAll('meta[http-equiv="refresh"]').forEach(m => m.remove());

        const headClone = htmlClone.querySelector('head');
        const bodyClone = htmlClone.querySelector('body');
        const bakedCSS = await bakeCSS(doc); 

        return {
          htmlAttrs: getAttributes(htmlClone),
          bodyAttrs: bodyClone ? getAttributes(bodyClone) : '',
          safeHead: (headClone ? sanitizeHtml(headClone.innerHTML) : '') + bakedCSS + getBaseStyles(),
          safeBody: bodyClone ? sanitizeHtml(bodyClone.innerHTML) : ''
        };
      };

      let snapshotHtml = '';

      if (topDoc.body.tagName.toUpperCase() === 'FRAMESET') {
        let framesHtml = '';
        const collectFrames = async (win: Window) => {
          for (let i = 0; i < win.frames.length; i++) {
            try {
              const f = win.frames[i];
              if (f.name === 'magic-mapper-iframe') continue;
              
              if (f.document.body.tagName.toUpperCase() === 'FRAMESET') {
                await collectFrames(f);
              } else {
                const { htmlAttrs, bodyAttrs, safeHead, safeBody } = await freezeDocument(f.document);
                const baseTag = `<base href="${f.location.href}">`;
                
                const frameContent = `
                  <!DOCTYPE html>
                  <html ${htmlAttrs}>
                    <head>${baseTag}${safeHead}</head>
                    <body ${bodyAttrs}>${safeBody}</body>
                  </html>
                `;
                
                const escapedContent = frameContent.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
                
                framesHtml += `
                  <div style="flex: 1; min-width: 45%; border: 2px solid #cbd5e1; border-radius: 8px; margin: 4px; overflow: hidden; display: flex; flex-direction: column; background: #fff;">
                    <div style="background: #e2e8f0; padding: 4px 8px; font-size: 12px; font-weight: bold; color: #475569;">🖼️ ${f.name || 'Frame'}</div>
                    <iframe srcdoc="${escapedContent}" style="width: 100%; height: 500px; border: none;" sandbox="allow-same-origin allow-scripts"></iframe>
                  </div>
                `;
              }
            } catch(e) {}
          }
        };
        
        if (window.top) await collectFrames(window.top);

        snapshotHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { background: #e2e8f0; padding: 8px; margin: 0; display: flex; flex-wrap: wrap; width: 1024px; min-height: 100vh; align-content: flex-start; }
              </style>
            </head>
            <body>${framesHtml}</body>
          </html>
        `;
      } else {
        const { htmlAttrs, bodyAttrs, safeHead, safeBody } = await freezeDocument(topDoc);
        const baseTag = `<base href="${url}">`;

        snapshotHtml = `
          <!DOCTYPE html>
          <html ${htmlAttrs}>
            <head>${baseTag}${safeHead}</head>
            <body ${bodyAttrs}>${safeBody}</body>
          </html>
        `;
      }

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

  const captureUrlOnly = async (): Promise<string | null> => {
    try {
      const topDoc = window.top?.document || document;
      const url = topDoc.location.href;
      const title = topDoc.title || '無題のページ';

      try {
        await navigator.clipboard.writeText(url);
      } catch(e) {}

      const snapshotHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; color: #334155; }
              .card { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; max-width: 80%; text-align: center; }
              a { color: #4f46e5; text-decoration: none; word-break: break-all; font-weight: bold; font-size: 16px; margin-top: 16px; display: inline-block; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="card">
              <div style="font-size: 40px; margin-bottom: 16px;">🔗</div>
              <h2 style="margin: 0 0 8px 0; font-size: 18px;">${title}</h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">このアイテムはURLのみストックされています</p>
              <a href="${url}" target="_blank">${url}</a>
            </div>
          </body>
        </html>
      `;

      const newSnapshot: SnapshotData = { url, title: `🔗 ${title}`, html: snapshotHtml };

      chrome.storage.local.get(['magicMapper_snapshots'], (res) => {
        const rawData = res.magicMapper_snapshots;
        const currentSnapshots: SnapshotData[] = Array.isArray(rawData) ? rawData : [];
        const filtered = currentSnapshots.filter(s => s.url !== url);
        const updated = [newSnapshot, ...filtered];
        chrome.storage.local.set({ magicMapper_snapshots: updated });
        setActiveUrl(url);
      });

      return url;
    } catch (err) {
      alert('URLのストックに失敗しました。');
      return null;
    }
  };

  const clearSnapshot = (urlToClear: string) => {
    chrome.storage.local.get(['magicMapper_snapshots'], (res) => {
      const rawData = res.magicMapper_snapshots;
      const currentSnapshots: SnapshotData[] = Array.isArray(rawData) ? rawData : [];
      const updated = currentSnapshots.filter(s => s.url !== urlToClear);
      chrome.storage.local.set({ magicMapper_snapshots: updated });
      if (activeUrl === urlToClear) setActiveUrl(updated.length > 0 ? updated[0].url : null);
    });
  };

  const activeSnapshot = snapshots.find(s => s.url === activeUrl) || null;
  return { snapshots, activeUrl, setActiveUrl, activeSnapshot, captureSnapshot, captureUrlOnly, clearSnapshot };
};