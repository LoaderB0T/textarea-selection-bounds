import {
  CSSStyleDeclarationWritableKeys,
  Options,
  SelectionBounds,
  TextSelection,
} from './types.js';

const defaultRelevantStyles: string[] = ['font', 'lineHeight', 'border', 'padding', 'boxSizing'];

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
    result: { top: 0, left: 0, width: 0, height: 0, changed: false, text: '' },
    amountOfScrollY: 0,
    amountOfScrollX: 0,
  };
  private _computedTextAreaStyle: CSSStyleDeclaration;

  constructor(textArea: HTMLTextAreaElement, options?: Partial<Options>) {
    this._textArea = textArea;
    this._computedTextAreaStyle = getComputedStyle(this._textArea);
    this._options = {
      relevantStyles: options?.relevantStyles ?? [],
    };
  }

  public deleteStyleCache() {
    this._computedTextAreaStyle = getComputedStyle(this._textArea);
  }

  private getAllKeysStartingWith(startingWith: string[]): CSSStyleDeclarationWritableKeys[] {
    return Object.keys(this._computedTextAreaStyle).filter(key =>
      startingWith.some(start => key.startsWith(start))
    ) as CSSStyleDeclarationWritableKeys[];
  }

  private get relevantStyles(): CSSStyleDeclarationWritableKeys[] {
    return [...this.getAllKeysStartingWith(defaultRelevantStyles), ...this._options.relevantStyles];
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

  private compareCache(newCache: Omit<Cache, 'result'>): boolean {
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
    div.id = 'textarea-selection-bounds-div';
    const copyStyle = getComputedStyle(this._textArea);
    for (const prop of this.relevantStyles) {
      div.style[prop] = copyStyle[prop] as any;
    }
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = `${this._textArea.scrollWidth}px`;
    div.style.height = 'auto';
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';

    const textContentUntilSelection = this._textArea.value.substring(0, actualFrom);
    const textContentSelection = this._textArea.value.substring(actualFrom, actualTo);

    if (
      this.compareCache({
        textContent: this._textArea.value,
        selection: { from: actualFrom, to: actualTo },
        amountOfScrollY,
        amountOfScrollX,
      })
    ) {
      return this._cache.result;
    }

    const spanUntilSelection = document.createElement('span');
    spanUntilSelection.textContent = textContentUntilSelection;
    const spanSelection = document.createElement('span');
    spanSelection.textContent = textContentSelection;

    div.appendChild(spanUntilSelection);
    div.appendChild(spanSelection);

    document.body.appendChild(div);

    const divRect = div.getBoundingClientRect();
    const divTop = divRect.top;
    const divLeft = divRect.left;

    const textAreaRect = this._textArea.getBoundingClientRect();
    const textAreaTop = textAreaRect.top;
    const textAreaLeft = textAreaRect.left;

    const spanSelectionRect = spanSelection.getBoundingClientRect();

    const top = spanSelectionRect.top - divTop - amountOfScrollY + textAreaTop;
    const left = spanSelectionRect.left - divLeft - amountOfScrollX + textAreaLeft;
    const height = spanSelectionRect.height;
    const width = spanSelectionRect.width;

    document.body.removeChild(div);

    if (
      this._cache.result.top === top &&
      this._cache.result.left === left &&
      this._cache.result.height === height &&
      this._cache.result.width === width
    ) {
      return this._cache.result;
    }

    this._cache.result = { top, left, height, width, changed: false, text: textContentSelection };

    return {
      top,
      left,
      height,
      width,
      changed: true,
      text: textContentSelection,
    };
  }
}
