export type TextSelection = {
  from: number;
  to: number;
};

export type SelectionBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
  changed: boolean;
  text: string;
};

export type Options = {
  /**
   * The relevant styles to consider when calculating the selection bounds, additional to the default ones.
   * Only use this option if you experience issues with the default styles. Use the `debug` option to see which styles might be missing.
   */
  relevantStyles: CSSStyleDeclarationWritableKeys[];
  /**
   * Keeps the div element (used for calculating the bounds) visible after the calculation and draws a box showing the calculated coordinates.
   * Never use this in production.
   */
  debug: boolean;
};

export type CSSStyleDeclarationWritableKeys = Exclude<
  keyof CSSStyleDeclaration & string,
  'length' | 'parentRule'
>;
