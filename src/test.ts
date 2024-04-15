import { TextareaSelectionBounds } from './index.js';

const textarea = document.getElementById('textarea') as HTMLTextAreaElement;
const textareaLimit = document.getElementById('textareaLimit') as HTMLDivElement;

const a = new TextareaSelectionBounds(textarea, { debug: true, limits: ['self', textareaLimit] });

setInterval(() => {
  a.getBounds();
}, 10);
