declare module 'sonner' {
  interface ToastOptions {
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: React.CSSProperties;
    className?: string;
    dismissible?: boolean;
    id?: string;
  }

  export function toast(message: string, options?: ToastOptions): string;
  
  export namespace toast {
    function success(message: string, options?: ToastOptions): string;
    function error(message: string, options?: ToastOptions): string;
    function info(message: string, options?: ToastOptions): string;
    function warning(message: string, options?: ToastOptions): string;
    function loading(message: string, options?: ToastOptions): string;
    function dismiss(toastId?: string): void;
    function promise<T>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      } & ToastOptions
    ): Promise<T>;
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    hotkey?: string[];
    expand?: boolean;
    richColors?: boolean;
    duration?: number;
    visibleToasts?: number;
    closeButton?: boolean;
    toastOptions?: ToastOptions;
    className?: string;
    style?: React.CSSProperties;
    offset?: string | number;
    dir?: 'rtl' | 'ltr' | 'auto';
    theme?: 'light' | 'dark' | 'system';
    cn?: (...args: any[]) => string;
  }

  export function Toaster(props?: ToasterProps): JSX.Element;
}
