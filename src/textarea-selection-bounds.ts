import {
  CSSStyleDeclarationWritableKeys,
  Options,
  SelectionBounds,
  TextElement,
  TextSelection,
} from './types.js';

type GetAllPossibleBeginningsOfString<
  T extends CSSStyleDeclarationWritableKeys,
  BeginsWith extends string,
> = T extends `${BeginsWith}${infer Start}${infer End}`
  ? End extends ''
    ? `${BeginsWith}${Start}`
    :
        | GetAllPossibleBeginningsOfString<T, `${BeginsWith}${Start}`>
        | (BeginsWith extends '' ? never : BeginsWith)
  : never;

type PartialWritableCSSStyleDeclaration = GetAllPossibleBeginningsOfString<
  CSSStyleDeclarationWritableKeys,
  ''
>;

const ZERO_WIDTH_SPACE = '\u200B';

const defaultRelevantStyles: PartialWritableCSSStyleDeclaration[] = [
  'font',
  'lineHeight',
  'border',
  'padding',
  'overflowWrap',
];
const debugMarkerId = 'textarea-selection-bounds-debug-marker';
const measureDivId = 'textarea-selection-bounds-div';

type Cache = {
  textContent: string;
  selection: TextSelection;
  result: SelectionBounds;
  amountOfScrollY: number;
  amountOfScrollX: number;
  textElementTop: number;
  textElementLeft: number;
  textElementWidth: number;
  textElementHeight: number;
};

const supportedElements = ['textarea', 'text', 'search', 'url', 'tel', 'password'];

export class TextareaSelectionBounds {
  // @internal
  private readonly _textElement: TextElement;
  // @internal
  private readonly _options: Options;
  // @internal
  private readonly _cache: Cache = {
    textContent: '',
    selection: { from: 0, to: 0 },
    result: { top: 0, left: 0, width: 0, height: 0, changed: false, text: '' },
    amountOfScrollY: 0,
    amountOfScrollX: 0,
    textElementTop: 0,
    textElementLeft: 0,
    textElementWidth: 0,
    textElementHeight: 0,
  };
  // @internal
  private readonly _limitCache: (HTMLElement | null)[] = [];
  // @internal
  private _computedTextElementStyle: CSSStyleDeclaration;

  /**
   * Creates a new instance of TextareaSelectionBounds.
   * @param textElement The textarea or input element to get the selection bounds for.
   * @param options The options to use.
   */
  constructor(textElement: TextElement, options?: Partial<Options>) {
    this._textElement = textElement;
    const inpuType =
      textElement.tagName === 'INPUT' ? textElement.getAttribute('type') || 'text' : 'textarea';
    if (!supportedElements.includes(inpuType?.toLowerCase())) {
      console.error('The textElement element must be of the following types', supportedElements);
      throw new Error('Invalid element type');
    }
    this._options = {
      relevantStyles: options?.relevantStyles ?? [],
      debug: options?.debug ?? false,
      limits: options?.limits ?? [],
    };
    this._computedTextElementStyle = this.window.getComputedStyle(this._textElement);
  }

  // @internal
  private getAllKeysStartingWith(startingWith: string[]): CSSStyleDeclarationWritableKeys[] {
    return Array.from(this._computedTextElementStyle).filter(key =>
      startingWith.some(start => key.startsWith(start))
    ) as CSSStyleDeclarationWritableKeys[];
  }

  // @internal
  private get relevantStyles(): CSSStyleDeclarationWritableKeys[] {
    const defaultRelevantStylesDashCase = defaultRelevantStyles.map(s =>
      s.replace(/[A-Z]/g, '-$&').toLowerCase()
    );

    return [
      ...this.getAllKeysStartingWith(defaultRelevantStylesDashCase),
      ...this._options.relevantStyles.map(s => s.replace(/[A-Z]/g, '-$&').toLowerCase()),
    ] as CSSStyleDeclarationWritableKeys[];
  }

  private get window(): Window {
    const win = this._textElement.ownerDocument.defaultView;
    if (!win) {
      throw new Error('The textarea element must be in a document with a default view.');
    }
    return win;
  }

  // @internal
  private compareCache(newCache: Omit<Cache, 'result'>): boolean {
    const isEqual =
      this._cache.textContent === newCache.textContent &&
      this._cache.selection.from === newCache.selection.from &&
      this._cache.selection.to === newCache.selection.to &&
      this._cache.amountOfScrollY === newCache.amountOfScrollY &&
      this._cache.amountOfScrollX === newCache.amountOfScrollX &&
      this._cache.textElementTop === newCache.textElementTop &&
      this._cache.textElementLeft === newCache.textElementLeft &&
      this._cache.textElementWidth === newCache.textElementWidth &&
      this._cache.textElementHeight === newCache.textElementHeight;

    if (!isEqual) {
      this._cache.textContent = newCache.textContent;
      this._cache.selection = newCache.selection;
      this._cache.amountOfScrollY = newCache.amountOfScrollY;
      this._cache.amountOfScrollX = newCache.amountOfScrollX;
      this._cache.textElementTop = newCache.textElementTop;
      this._cache.textElementLeft = newCache.textElementLeft;
      this._cache.textElementWidth = newCache.textElementWidth;
      this._cache.textElementHeight = newCache.textElementHeight;
    }

    return isEqual;
  }

  // @internal
  private getBoundsForSelection(selection: TextSelection): SelectionBounds {
    const actualFrom = Math.min(selection.from, selection.to);
    const actualTo = Math.max(selection.from, selection.to);

    const amountOfScrollY = this._textElement.scrollTop;
    const amountOfScrollX = this._textElement.scrollLeft;

    const div = document.createElement('div');
    div.id = measureDivId;
    const copyStyle = this.window.getComputedStyle(this._textElement);
    for (const prop of this.relevantStyles) {
      div.style[prop] = copyStyle[prop] as any;
    }
    div.style.whiteSpace = 'pre-wrap';
    const widthForMeasureDiv =
      this._textElement.offsetWidth ===
      this._textElement.scrollWidth +
        this.pxToNumber(copyStyle.borderRightWidth) +
        this.pxToNumber(copyStyle.borderLeftWidth)
        ? this._textElement.offsetWidth
        : this._textElement.scrollWidth;

    div.style.width = `${widthForMeasureDiv}px`;
    div.style.height = 'auto';
    div.style.boxSizing = 'border-box';
    if (!this._options.debug) {
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
    }

    const textContentUntilSelection = this._textElement.value.substring(0, actualFrom);
    const textContentSelection = this._textElement.value.substring(actualFrom, actualTo);
    const textContentAfterSelection = this._textElement.value.substring(actualTo);

    const textElementRect = this._textElement.getBoundingClientRect();
    const textElementTop = textElementRect.top;
    const textElementLeft = textElementRect.left;

    if (
      this.compareCache({
        textContent: this._textElement.value,
        selection: { from: actualFrom, to: actualTo },
        amountOfScrollY,
        amountOfScrollX,
        textElementTop: textElementTop,
        textElementLeft: textElementLeft,
        textElementWidth: this._textElement.offsetWidth,
        textElementHeight: this._textElement.offsetHeight,
      })
    ) {
      return this._cache.result;
    }

    const spanUntilSelection = document.createElement('span');
    spanUntilSelection.textContent = textContentUntilSelection;
    const spanSelection = document.createElement('span');

    spanSelection.textContent = textContentSelection + ZERO_WIDTH_SPACE;
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

    const spanSelectionRect = spanSelection.getBoundingClientRect();

    let top = spanSelectionRect.top - divTop - amountOfScrollY + textElementTop;
    let left = spanSelectionRect.left - divLeft - amountOfScrollX + textElementLeft;
    let height = spanSelection.offsetHeight;
    let width = spanSelection.offsetWidth;

    if (this._options.limits.length) {
      const limitingElements = this._options.limits
        .map((limit, i) => {
          if (limit === 'self') {
            return this._textElement;
          } else if (typeof limit === 'function') {
            this._limitCache[i] ??= limit();
            return this._limitCache[i];
          } else {
            return limit;
          }
        })
        .filter(el => el !== null) as HTMLElement[];

      limitingElements.forEach(el => {
        const elRect = el.getBoundingClientRect();
        const elTop = elRect.top;
        const elLeft = elRect.left;
        const elHeight = elRect.height;
        const elWidth = elRect.width;

        if (top < elTop) {
          height -= elTop - top;
          top = elTop;
        }

        if (left < elLeft) {
          width -= elLeft - left;
          left = elLeft;
        }

        if (top + height > elTop + elHeight) {
          height = elTop + elHeight - top;
        }

        if (left + width > elLeft + elWidth) {
          width = elLeft + elWidth - left;
        }
        if (height < 0) {
          height = 0;
        }
        if (width < 0) {
          width = 0;
        }
      });
    }

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
      marker.style.position = 'fixed';
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
   * Deletes the style cache. Call this is the textElement style has changed (e.g. font size, padding, etc.)
   */
  public deleteStyleCache(): void {
    this._computedTextElementStyle = this.window.getComputedStyle(this._textElement);
    this._limitCache.length = 0;
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
      from: this._textElement.selectionStart ?? 0,
      to: this._textElement.selectionEnd ?? 0,
    };
  }

  /**
   * Returns the bounds of the selection.
   * @param selection The selection to get the bounds for. If not provided, the current selection will be used. If 'full' is provided, it is assumed that all text is selected.
   * @returns The bounds of the selection, a changed flag, and the selected text.
   * @example
   * const bounds = textareaSelectionBounds.getBounds();
   * console.log(bounds);
   * // { top: 10, left: 20, width: 30, height: 40, changed: true, text: 'Hello' }
   */
  public getBounds(selection?: TextSelection | 'full'): SelectionBounds {
    const useSelection = selection ?? this.getCurrentSelection();
    if (useSelection === 'full') {
      return this.getBoundsForSelection({
        from: 0,
        to: this._textElement.value.length,
      });
    }
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

  private pxToNumber(px: string): number {
    return parseFloat(px.replace('px', ''));
  }
}
