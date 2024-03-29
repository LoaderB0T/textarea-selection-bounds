import { TextareaSelectionBounds } from './index.js';

const textarea = document.getElementById('textarea') as HTMLTextAreaElement;

const a = new TextareaSelectionBounds(textarea);

const marker = document.getElementById('marker') as HTMLDivElement;

setInterval(() => {
  const bounds = a.getBounds();

  marker.style.top = `${bounds.top}px`;
  marker.style.left = `${bounds.left}px`;
  marker.style.width = `${bounds.width}px`;
  marker.style.height = `${bounds.height}px`;
});
