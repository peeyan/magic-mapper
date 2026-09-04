import { useState, useEffect, useCallback } from 'react';

export const useDropMode = () => {
  const [grabbedText, setGrabbedTextLocal] = useState<string | null>(null);

  // ★追加1：Storage監視
  useEffect(() => {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes.magicMapper_grabbedText) {
        setGrabbedTextLocal((changes.magicMapper_grabbedText.newValue as string) || null);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // ★追加2：Storage更新
  const setGrabbedText = useCallback((val: string | null) => {
    setGrabbedTextLocal(val);
    chrome.storage.local.set({ magicMapper_grabbedText: val });
  }, []);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      target.style.outline = '3px solid #2ed573';
      target.style.cursor = 'cell';
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
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      e.preventDefault();
      e.stopPropagation();
      const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
      inputElement.value = grabbedText;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      target.style.outline = '';
      target.style.cursor = '';
      setGrabbedText(null); // ★ドロップ完了時、全フレームに「離した」と通知
    }
  }, [grabbedText, setGrabbedText]);

  useEffect(() => {
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