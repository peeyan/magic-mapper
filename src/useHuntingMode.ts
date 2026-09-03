import { useState, useEffect, useCallback } from 'react';

export const useHuntingMode = (onCapture: (text: string) => void) => {
  const [isHunting, setIsHunting] = useState(false);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    target.style.outline = '3px solid #ff7b00';
    target.style.cursor = 'crosshair';
  }, []);

  const handleMouseOut = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    target.style.outline = '';
    target.style.cursor = '';
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    const text = target.innerText?.trim();

    if (text) {
      onCapture(text);
      setIsHunting(false);
    }

    target.style.outline = '';
    target.style.cursor = '';
  }, [onCapture]);

  useEffect(() => {
    if (isHunting) {
      document.addEventListener('mouseover', handleMouseOver, { capture: true });
      document.addEventListener('mouseout', handleMouseOut, { capture: true });
      document.addEventListener('click', handleClick, { capture: true });
    } else {
      document.removeEventListener('mouseover', handleMouseOver, { capture: true });
      document.removeEventListener('mouseout', handleMouseOut, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
    }
    return () => {
      document.removeEventListener('mouseover', handleMouseOver, { capture: true });
      document.removeEventListener('mouseout', handleMouseOut, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [isHunting, handleMouseOver, handleMouseOut, handleClick]);

  return { isHunting, setIsHunting };
};