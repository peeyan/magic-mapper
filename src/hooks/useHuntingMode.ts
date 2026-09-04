import { useState, useEffect, useCallback } from 'react';

export const useHuntingMode = (onPickText: (text: string) => void) => {
  const [isHunting, setIsHuntingLocal] = useState(false);

  // ★追加1：Storageの変更を監視して、全フレーム同時にハントON/OFFする
  useEffect(() => {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes.magicMapper_isHunting) {
        setIsHuntingLocal((changes.magicMapper_isHunting.newValue as boolean) || false);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // ★追加2：ボタンを押した時にStorageも更新する
  const setIsHunting = useCallback((val: boolean) => {
    setIsHuntingLocal(val);
    chrome.storage.local.set({ magicMapper_isHunting: val });
  }, []);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('#magic-mapper-root') || target.closest('[data-magic-mapper]')) return;
    target.style.outline = '2px dashed #f43f5e';
    target.style.cursor = 'crosshair';
  }, []);

  const handleMouseOut = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    target.style.outline = '';
    target.style.cursor = '';
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('#magic-mapper-root') || target.closest('[data-magic-mapper]')) return;

    e.preventDefault();
    e.stopPropagation();

    const text = target.innerText?.trim();
    if (text) onPickText(text);

    target.style.outline = '';
    target.style.cursor = '';
    setIsHunting(false); // ★ハント完了時、全フレームに「終了」を通知
  }, [onPickText, setIsHunting]);

  useEffect(() => {
    if (isHunting) {
      document.addEventListener('mouseover', handleMouseOver, { capture: true });
      document.addEventListener('mouseout', handleMouseOut, { capture: true });
      document.addEventListener('click', handleClick, { capture: true });
    }
    return () => {
      document.removeEventListener('mouseover', handleMouseOver, { capture: true });
      document.removeEventListener('mouseout', handleMouseOut, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [isHunting, handleMouseOver, handleMouseOut, handleClick]);

  return { isHunting, setIsHunting };
};