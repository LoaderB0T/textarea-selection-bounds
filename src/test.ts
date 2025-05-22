import { TextareaSelectionBounds } from './index.js';

const textarea = document.getElementById('textarea') as HTMLTextAreaElement;
const textareaLimit = document.getElementById('textareaLimit') as HTMLDivElement;

const a = new TextareaSelectionBounds(textarea, { debug: true });

setInterval(() => {
  textarea.style.height = `${a.getBounds('full').height + 10}px`;
}, 2000);
