import React from 'react';
import { createRoot } from 'react-dom/client';
import { StockPalette } from './StockPalette';

// 1. Reactを入れるための箱（div）を作る
const container = document.createElement('div');
container.id = 'magic-mapper-root';
document.body.appendChild(container);

// 2. サイトのCSSから守るバリア（Shadow DOM）を張る！
const shadowRoot = container.attachShadow({ mode: 'open' });

// 3. バリアの中にさらにReact描画用の箱を作る
const rootElement = document.createElement('div');
shadowRoot.appendChild(rootElement);

// 4. Reactをレンダリング！！！
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <StockPalette />
  </React.StrictMode>
);