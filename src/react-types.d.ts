// React 19 compatibility types
declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function memo<T extends React.ComponentType<any>>(component: T): T;
  
  export interface DragEvent<T = Element> extends React.SyntheticEvent<T, globalThis.DragEvent> {
    dataTransfer: DataTransfer;
    preventDefault(): void;
    stopPropagation(): void;
  }
  
  export namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      label: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
      select: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
      option: React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
    }
  }
}

declare namespace React {
  interface DetailedHTMLProps<E, T> {
    [key: string]: any;
  }
  
  interface HTMLAttributes<T> {
    [key: string]: any;
  }
  
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    onClick?: (event: any) => void;
    onMouseDown?: (event: any) => void;
    onMouseUp?: (event: any) => void;
    type?: string;
    disabled?: boolean;
    className?: string;
    style?: any;
  }
  
  interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {}
  interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: any;
    onChange?: (event: any) => void;
    disabled?: boolean;
  }
  interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: any;
  }
  
  interface SyntheticEvent<T = Element, E = Event> {
    preventDefault(): void;
    stopPropagation(): void;
  }
  
  type ComponentType<P = {}> = any;
}