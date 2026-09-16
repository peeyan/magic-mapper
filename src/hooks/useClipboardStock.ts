import { useEffect } from 'react';

export const useClipboardStock = (addStock: (text: string) => void, isActive: boolean) => {
  useEffect(() => {
    // パレットのタブがアクティブじゃない時は何もしない
    if (!isActive) return;

    const handleCopy = () => {
      // 1. Googleスプレッドシートかどうかの判定
      const isSpreadsheet = window.location.href.includes('docs.google.com/spreadsheets');

      // 2. KrewSheetかどうかの判定（画面内にKrewSheet特有の要素が存在するかでチェック）
      const isKrewSheet =
        !!document.querySelector('[id*="krewsheet" i]') ||
        !!document.querySelector('[class*="krewsheet" i]') ||
        !!document.querySelector('.gc-workbook');

      // ★ 神修正：スプレッドシートでもKrewSheetでもない場合は、処理を強制終了！
      if (!isSpreadsheet && !isKrewSheet) {
        return;
      }

      // コピー動作がOSのクリップボードに完了するのを一瞬（50ミリ秒）待ってから取得
      setTimeout(async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim() !== '') {
            addStock(text.trim());
          }
        } catch (e) {
          // CSPなどでクリップボードへのアクセスがブロックされた場合のエラー回避
        }
      }, 50);
    };

    // 'copy' イベント（Ctrl+C または 右クリック→コピー）を監視
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);

  }, [addStock, isActive]);
};