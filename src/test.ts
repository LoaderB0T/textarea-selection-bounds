import { TextareaSelectionBounds } from './textarea-selection-bounds';

const textArea = document.querySelector('textarea');
if (textArea) {
  const bounds = new TextareaSelectionBounds(textArea);
  console.log(bounds.getBounds());
}
