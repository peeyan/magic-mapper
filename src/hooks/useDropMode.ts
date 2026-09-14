import { useState, useEffect } from 'react';

export const useDropMode = () => {
  const [grabbedText, setGrabbedText] = useState<string | null>(null);

  useEffect(() => {
    // 全フレームのカーソルをリセットする関数
    const resetCursor = (win: Window) => {
      try { win.document.body.style.cursor = 'auto'; } catch(e) {}
      for (let i = 0; i < win.frames.length; i++) {
        try { resetCursor(win.frames[i]); } catch(e) {}
      }
    };

    if (!grabbedText) {
      resetCursor(window.top || window);
      return;
    }

    const handleDropClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#magic-mapper-root')) return;

      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isEditable = target.isContentEditable;

      if (isInput || isEditable) {
        e.preventDefault();
        e.stopPropagation();
        
        // 1. まずフォーカスを当てて、AgileWorksなどの `onfocus` イベントを発火させる
        target.focus();
        
        if (isInput) {
          const inputTarget = target as HTMLInputElement | HTMLTextAreaElement;
          
          // ★ AgileWorks特化：onkeydown / onkeyup などの内部処理を呼び起こすための儀式
          // 実際の入力前に、カラのキーイベントを発火させてシステム側を「入力状態」にさせる
          inputTarget.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
          inputTarget.dispatchEvent(new KeyboardEvent('keypress', { key: 'a', bubbles: true }));
          
          // ★ SPA（React/Vue等）の強固なState管理を突破する「ネイティブプロパティ強制上書き」
          const prototype = inputTarget.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputTarget, inputTarget.value + grabbedText);
          } else {
            inputTarget.value += grabbedText;
          }
          
          // 強制的に入力イベントを発火させ、システム側に「人間が入力した」と錯覚させる
          inputTarget.dispatchEvent(new Event('input', { bubbles: true }));
          inputTarget.dispatchEvent(new Event('change', { bubbles: true }));
          
          // ★ AgileWorks特化：入力完了として、keyup と blur（フォーカスアウト）を発火させる
          inputTarget.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
          
          // AgileWorksは `onblur` で値の妥当性チェック（DateCheckなど）を行っているため、
          // 意図的にフォーカスを外して保存処理を走らせる
          setTimeout(() => {
            inputTarget.blur();
          }, 50);
          
        } else if (isEditable) {
          if (!document.execCommand('insertText', false, grabbedText)) {
            target.innerText += grabbedText;
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
        }, 100);
      }
    };

    // ★ フレーム貫通：トップのwindowだけでなく、奥底のiframe/framesetにもイベントを仕掛ける
    const attachToAllFrames = (win: Window) => {
      try {
        win.document.body.style.cursor = 'crosshair';
        win.document.addEventListener('click', handleDropClick, true);
      } catch (e) {} // CORSエラーになる別ドメインのiframeは無視
      
      for (let i = 0; i < win.frames.length; i++) {
        try { attachToAllFrames(win.frames[i]); } catch (e) {}
      }
    };

    const detachFromAllFrames = (win: Window) => {
      try {
        win.document.body.style.cursor = 'auto';
        win.document.removeEventListener('click', handleDropClick, true);
      } catch (e) {}
      
      for (let i = 0; i < win.frames.length; i++) {
        try { detachFromAllFrames(win.frames[i]); } catch (e) {}
      }
    };

    const topWindow = window.top || window;
    attachToAllFrames(topWindow);

    return () => {
      detachFromAllFrames(topWindow);
    };
  }, [grabbedText]);

  return { grabbedText, setGrabbedText };
};