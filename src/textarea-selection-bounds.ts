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

type Cache = {
  textContent: string;
  selection: TextSelection;
  result: SelectionBounds;
  amountOfScrollY: number;
  amountOfScrollX: number;
};

export class TextareaSelectionBounds {
  private readonly _textArea: HTMLTextAreaElement;
  private readonly _options: Options;
  private readonly _cache: Cache = {
    textContent: '',
    selection: { from: 0, to: 0 },
    result: { top: 0, left: 0, width: 0, height: 0 },
    amountOfScrollY: 0,
    amountOfScrollX: 0,
  };

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

  private compareCache(newCache: Cache) {
    const isEqual =
      this._cache.textContent === newCache.textContent &&
      this._cache.selection.from === newCache.selection.from &&
      this._cache.selection.to === newCache.selection.to &&
      this._cache.amountOfScrollY === newCache.amountOfScrollY &&
      this._cache.amountOfScrollX === newCache.amountOfScrollX;

    if (!isEqual) {
      this._cache.textContent = newCache.textContent;
      this._cache.selection = newCache.selection;
      this._cache.amountOfScrollY = newCache.amountOfScrollY;
      this._cache.amountOfScrollX = newCache.amountOfScrollX;
    }

    return isEqual;
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

    if (
      this.compareCache({
        textContent: this._textArea.value,
        selection: { from: actualFrom, to: actualTo },
        result: { top: 0, left: 0, width: 0, height: 0 },
        amountOfScrollY,
        amountOfScrollX,
      })
    ) {
      return this._cache.result;
    }

    const spanZeroWidth = document.createElement('span');
    spanZeroWidth.textContent = '\u200B';
    const spanUntilSelection = document.createElement('span');
    spanUntilSelection.textContent = textContentUntilSelection;
    const spanSelection = document.createElement('span');
    spanSelection.textContent = textContentSelection;

    div.appendChild(spanUntilSelection);
    div.appendChild(spanZeroWidth);
    div.appendChild(spanSelection);

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

    this._cache.result = { top, left, height, width };

    return {
      top,
      left,
      height,
      width,
    };
  }
}
