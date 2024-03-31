import { TextareaSelectionBounds } from './index.js';

const textarea = document.getElementById('textarea') as HTMLTextAreaElement;

const a = new TextareaSelectionBounds(textarea, { debug: true });

setInterval(() => {
  a.getBounds();
}, 10);
