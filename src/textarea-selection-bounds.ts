import {
  CSSStyleDeclarationWritableKeys,
  Options,
  SelectionBounds,
  TextSelection,
} from './types.js';

const defaultRelevantStyles: string[] = ['font', 'lineHeight', 'border', 'padding'];
const debugMarkerId = 'textarea-selection-bounds-debug-marker';
const measureDivId = 'textarea-selection-bounds-div';

type Cache = {
  textContent: string;
  selection: TextSelection;
  result: SelectionBounds;
  amountOfScrollY: number;
  amountOfScrollX: number;
};

export class TextareaSelectionBounds {
  // @internal
  private readonly _textArea: HTMLTextAreaElement;
  // @internal
  private readonly _options: Options;
  // @internal
  private readonly _cache: Cache = {
    textContent: '',
    selection: { from: 0, to: 0 },
    result: { top: 0, left: 0, width: 0, height: 0, changed: false, text: '' },
    amountOfScrollY: 0,
    amountOfScrollX: 0,
  };
  // @internal
  private _computedTextAreaStyle: CSSStyleDeclaration;

  /**
   * Creates a new instance of TextareaSelectionBounds.
   * @param textArea The textarea element to get the selection bounds for.
   * @param options The options to use.
   */
  constructor(textArea: HTMLTextAreaElement, options?: Partial<Options>) {
    this._textArea = textArea;
    this._computedTextAreaStyle = getComputedStyle(this._textArea);
    this._options = {
      relevantStyles: options?.relevantStyles ?? [],
      debug: options?.debug ?? false,
    };
  }

  // @internal
  private getAllKeysStartingWith(startingWith: string[]): CSSStyleDeclarationWritableKeys[] {
    return Object.keys(this._computedTextAreaStyle).filter(key =>
      startingWith.some(start => key.startsWith(start))
    ) as CSSStyleDeclarationWritableKeys[];
  }

  // @internal
  private get relevantStyles(): CSSStyleDeclarationWritableKeys[] {
    return [...this.getAllKeysStartingWith(defaultRelevantStyles), ...this._options.relevantStyles];
  }

  // @internal
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

  // @internal
  private getBoundsForSelection(selection: TextSelection): SelectionBounds {
    const actualFrom = Math.min(selection.from, selection.to);
    const actualTo = Math.max(selection.from, selection.to);

    const amountOfScrollY = this._textArea.scrollTop;
    const amountOfScrollX = this._textArea.scrollLeft;

    const div = document.createElement('div');
    div.id = measureDivId;
    const copyStyle = getComputedStyle(this._textArea);
    for (const prop of this.relevantStyles) {
      div.style[prop] = copyStyle[prop] as any;
    }
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = `${this._textArea.scrollWidth}px`;
    div.style.height = 'auto';
    div.style.boxSizing = 'border-box';
    if (!this._options.debug) {
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
    }

    const textContentUntilSelection = this._textArea.value.substring(0, actualFrom);
    const textContentSelection = this._textArea.value.substring(actualFrom, actualTo);
    const textContentAfterSelection = this._textArea.value.substring(actualTo);

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
    if (this._options.debug) {
      spanSelection.style.backgroundColor = 'rgba(0, 0, 255, 0.3)';
    }
    const spanAfterSelection = document.createElement('span');
    spanAfterSelection.textContent = textContentAfterSelection;

    div.appendChild(spanUntilSelection);
    div.appendChild(spanSelection);
    div.appendChild(spanAfterSelection);

    if (this._options.debug) {
      const existingDiv = document.getElementById(measureDivId);
      if (existingDiv) {
        document.body.removeChild(existingDiv);
      }
    }

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

    if (!this._options.debug) {
      document.body.removeChild(div);
    }

    if (
      this._cache.result.top === top &&
      this._cache.result.left === left &&
      this._cache.result.height === height &&
      this._cache.result.width === width
    ) {
      return this._cache.result;
    }

    this._cache.result = { top, left, height, width, changed: false, text: textContentSelection };

    const res: SelectionBounds = {
      top,
      left,
      height,
      width,
      changed: true,
      text: textContentSelection,
    };

    // Logs & draws a box around the selection in debug mode
    if (this._options.debug) {
      console.log(res);
      const marker = document.createElement('div');
      marker.id = debugMarkerId;
      marker.style.position = 'absolute';
      marker.style.pointerEvents = 'none';
      marker.style.backgroundColor = '#ff00424d';
      marker.style.top = `${res.top}px`;
      marker.style.left = `${res.left}px`;
      marker.style.width = `${res.width}px`;
      marker.style.height = `${res.height}px`;
      marker.style.zIndex = '999999999';
      const existingMarker = document.getElementById(debugMarkerId);
      if (existingMarker) {
        document.body.removeChild(existingMarker);
      }
      document.body.appendChild(marker);
    }

    return res;
  }

  /**
   * Deletes the style cache. Call this is the textarea style has changed (e.g. font size, padding, etc.)
   */
  public deleteStyleCache(): void {
    this._computedTextAreaStyle = getComputedStyle(this._textArea);
  }

  /**
   * Returns the current selection bounds.
   * @returns The current selection bounds.
   * @example
   * const bounds = textareaSelectionBounds.getCurrentSelection();
   * console.log(bounds);
   * // { from: 0, to: 5 }
   */
  public getCurrentSelection(): TextSelection {
    return {
      from: this._textArea.selectionStart,
      to: this._textArea.selectionEnd,
    };
  }

  /**
   * Returns the bounds of the selection.
   * @param selection The selection to get the bounds for. If not provided, the current selection will be used.
   * @returns The bounds of the selection, a changed flag, and the selected text.
   * @example
   * const bounds = textareaSelectionBounds.getBounds();
   * console.log(bounds);
   * // { top: 10, left: 20, width: 30, height: 40, changed: true, text: 'Hello' }
   */
  public getBounds(selection?: TextSelection): SelectionBounds {
    const useSelection = selection ?? this.getCurrentSelection();
    return this.getBoundsForSelection(useSelection);
  }

  /**
   * Returns the bounding client rect of the selection.
   * @param selection The selection to get the bounding client rect for. If not provided, the current selection will be used.
   * @returns The bounding client rect of the selection.
   */
  public getBoundingClientRect(selection?: TextSelection): DOMRect {
    const bounds = this.getBounds(selection);
    return new DOMRect(bounds.left, bounds.top, bounds.width, bounds.height);
  }
}
