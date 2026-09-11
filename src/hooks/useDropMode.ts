import { useState, useEffect } from 'react';

export const useDropMode = () => {
  const [grabbedText, setGrabbedText] = useState<string | null>(null);

  useEffect(() => {
    if (!grabbedText) {
      document.body.style.cursor = 'auto';
      return;
    }

    document.body.style.cursor = 'crosshair';

    const handleDropClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#magic-mapper-root')) return;

      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isEditable = target.isContentEditable;

      if (isInput || isEditable) {
        e.preventDefault();
        e.stopPropagation();
        target.focus();
        
        if (!document.execCommand('insertText', false, grabbedText)) {
          if (isInput) {
            (target as HTMLInputElement).value += grabbedText;
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        setGrabbedText(null);
      } 
      else {
        // ★★★ スプレッドシート ＆ krewSheet 攻略ルート ★★★
        // e.preventDefault() は呼ばず、まずは普通のセル選択を貫通させる

        // 🚀【krewSheet特効】プログラムから強制的にダブルクリックを発射し、入力モードをこじ開ける！
        target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));

        // セルの上に隠しエディタ（input）が立ち上がるのを 0.1秒だけ待つ
        setTimeout(async () => {
          try {
            // 裏側でクリップボードには確実に装填しておく
            await navigator.clipboard.writeText(grabbedText);
            
            // ダブルクリックによって出現した「隠し入力フォーム」を捕まえる！
            const activeEl = document.activeElement as HTMLElement;
            
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
              // krewSheetのエディタが無事に開いていれば、そこに直接流し込む！
              document.execCommand('insertText', false, grabbedText);
              // execCommandが効かなかった時の保険
              if (!(activeEl as HTMLInputElement).value.includes(grabbedText)) {
                (activeEl as HTMLInputElement).value += grabbedText;
                activeEl.dispatchEvent(new Event('input', { bubbles: true }));
              }
            } else {
              // エディタが開かなかった場合（Googleスプレッドシート等）は、標準のペーストイベントを叩き込む
              const dt = new DataTransfer();
              dt.setData('text/plain', grabbedText);
              
              // 念のため Ctrl+V のキーボードイベントも発火させておく
              const keydown = new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', keyCode: 86, ctrlKey: true, bubbles: true });
              (activeEl || target).dispatchEvent(keydown);
              
              (activeEl || target).dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
            }
          } catch(err) {}
          
          setGrabbedText(null); // 完了したら手放す
        }, 100); // 待機時間を 50ms -> 100ms に延長（エディタの起動を待つため）
      }
    };

    document.addEventListener('click', handleDropClick, true);
    return () => {
      document.body.style.cursor = 'auto';
      document.removeEventListener('click', handleDropClick, true);
    };
  }, [grabbedText]);

  return { grabbedText, setGrabbedText };
};