import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

const w = window as Window & { __hideSplash?: () => void };
if (typeof w.__hideSplash === 'function') {
  w.__hideSplash();
}