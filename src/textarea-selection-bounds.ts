import { CSSStyleDeclarationWritableKeys, Options, SelectionBounds, TextSelection } from './types';

const defaultRelevantStyles: CSSStyleDeclarationWritableKeys[] = [
  'font',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'fontVariant',
  'lineHeight',
];

export class TextareaSelectionBounds {
  private readonly _textArea: HTMLTextAreaElement;
  private readonly _options: Options;

  constructor(textArea: HTMLTextAreaElement, options?: Partial<Options>) {
    this._textArea = textArea;
    this._options = {
      relevantStyles: options?.relevantStyles ?? [],
      textAreaPadding: options?.textAreaPadding ?? { top: 0, left: 0 },
    };
  }

  private get relevantStyles(): CSSStyleDeclarationWritableKeys[] {
    return [...defaultRelevantStyles, ...this._options.relevantStyles];
  }

  public getCurrentSelection(): TextSelection {
    return {
      from: this._textArea.selectionStart,
      to: this._textArea.selectionEnd,
    };
  }

  public getBounds() {
    const selection = this.getCurrentSelection();
    return this.getBoundsForSelection(selection);
  }

  public getBoundsForSelection(selection: TextSelection): SelectionBounds {
    const actualFrom = Math.min(selection.from, selection.to);
    const actualTo = Math.max(selection.from, selection.to);

    const amountOfScrollY = this._textArea.scrollTop;
    const amountOfScrollX = this._textArea.scrollLeft;

    const div = document.createElement('div');
    const copyStyle = getComputedStyle(this._textArea);
    for (const prop of this.relevantStyles) {
      div.style[prop] = copyStyle[prop] as any;
    }
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = `${this._textArea.scrollWidth}px`;
    div.style.height = 'auto';

    const textContentUntilSelection = this._textArea.value.substring(0, actualFrom);
    const textContentSelection = this._textArea.value.substring(actualFrom, actualTo);

    const spanZeroWidth = document.createElement('span');
    spanZeroWidth.textContent = '\u200B';
    const spanZeroWidth2 = document.createElement('span');
    spanZeroWidth2.textContent = '\u200B';
    const spanUntilSelection = document.createElement('span');
    spanUntilSelection.textContent = textContentUntilSelection;
    const spanSelection = document.createElement('span');
    spanSelection.textContent = textContentSelection;

    div.appendChild(spanUntilSelection);
    div.appendChild(spanZeroWidth);
    div.appendChild(spanSelection);
    div.appendChild(spanZeroWidth2);

    document.body.appendChild(div);

    const divTop = div.getBoundingClientRect().top;
    const divLeft = div.getBoundingClientRect().left;

    const top =
      spanZeroWidth.getBoundingClientRect().top -
      divTop -
      amountOfScrollY +
      this._options.textAreaPadding.top;
    const left =
      spanSelection.getBoundingClientRect().left -
      divLeft -
      amountOfScrollX +
      this._options.textAreaPadding.left;
    const height = spanSelection.getBoundingClientRect().height;
    const width = spanSelection.getBoundingClientRect().width;

    document.body.removeChild(div);

    return {
      top,
      left,
      height,
      width,
    };
  }
}
