import React from 'react'
import ReactDOM from 'react-dom/client'
import { StockPalette } from './components/StockPalette'

if (!document.getElementById('magic-mapper-root')) {
  const root = document.createElement('div');
  root.id = 'magic-mapper-root';

  // ★ 究極の魔法：bodyやframesetの中ではなく、大元の <html> 直下に追加！
  // これにより、フレームの壁を無視して画面全体の上にUIが浮遊します！！
  document.documentElement.appendChild(root);

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <StockPalette />
    </React.StrictMode>
  );
}