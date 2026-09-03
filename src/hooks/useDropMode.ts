import { useState, useEffect, useCallback } from 'react';

export const useDropMode = () => {
  // 掴んでいるテキスト（nullなら何も掴んでいない状態）
  const [grabbedText, setGrabbedText] = useState<string | null>(null);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // 入力フォームかどうか判定
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      target.style.outline = '3px solid #2ed573'; // 貼り付け先は「緑色」でハイライト！
      target.style.cursor = 'cell'; // カーソルを十字に変更
    }
  }, []);

  const handleMouseOut = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    target.style.outline = '';
    target.style.cursor = '';
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!grabbedText) return;

    const target = e.target as HTMLElement;
    
    // クリックした場所が入力フォームだったら…
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      e.preventDefault();
      e.stopPropagation();

      const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
      
      // ★激アツポイント：テキストを挿入する！
      inputElement.value = grabbedText; 
      
      // ※Reactなどで作られたサイトでも正しく認識されるように、裏側で「入力したよ！」というイベントを飛ばす
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));

      // 貼り付けが終わったら、スタイルを元に戻してDropモード終了！
      target.style.outline = '';
      target.style.cursor = '';
      setGrabbedText(null);
    }
  }, [grabbedText]);

  useEffect(() => {
    // テキストを掴んでいる時だけ、Dropモード発動！
    if (grabbedText !== null) {
      document.addEventListener('mouseover', handleMouseOver, { capture: true });
      document.addEventListener('mouseout', handleMouseOut, { capture: true });
      document.addEventListener('click', handleClick, { capture: true });
    }
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver, { capture: true });
      document.removeEventListener('mouseout', handleMouseOut, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [grabbedText, handleMouseOver, handleMouseOut, handleClick]);

  return { grabbedText, setGrabbedText };
};