/**
 * スプレッドシートやExcelからコピーされたテキスト（TSV形式）を
 * セルごとに正確に分割する解析エンジン
 */
export const parseSpreadsheetData = (rawText: string): string[] => {
  const cells: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < rawText.length; i++) {
    const char = rawText[i];
    const nextChar = rawText[i + 1];

    if (char === '"') {
      // セル内で「""」と連続している場合は「"」1つに変換
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォーテーションの開始/終了スイッチ
        insideQuotes = !insideQuotes;
      }
    } else if (!insideQuotes && (char === '\t' || char === '\n' || char === '\r')) {
      // クォーテーションの「外側」の改行やタブで分割
      cells.push(currentCell);
      currentCell = '';
      // Windows特有の改行（CRLF）を綺麗にスキップ
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      // クォーテーションの「内側」の改行や、普通の文字はそのまま繋げる
      currentCell += char;
    }
  }
  cells.push(currentCell);

  // 余白を消して、空っぽのセルを除外して返す
  return cells.map(c => c.trim()).filter(c => c !== '');
};