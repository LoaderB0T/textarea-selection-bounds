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
  relevantStyles: CSSStyleDeclarationWritableKeys[];
  textAreaPadding: {
    top: number;
    left: number;
  };
};

export type CSSStyleDeclarationWritableKeys = Exclude<
  keyof CSSStyleDeclaration & string,
  'length' | 'parentRule'
>;
