import { useState, useCallback, useRef } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
  isClosing?: boolean;
}

/**
 * トースト通知を管理するカスタムフック
 *
 * @returns トースト状態と表示関数
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const nextIdRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number, skipDuplicateCheck: boolean = false): number | null => {
      // 同じメッセージが既に表示されている場合は追加しない（skipDuplicateCheckがtrueの場合はチェックをスキップ）
      let toastId: number | null = null;
      setToasts((prev) => {
        if (!skipDuplicateCheck) {
          const isDuplicate = prev.some(
            (toast) => toast.message === message && toast.type === type
          );
          if (isDuplicate) {
            return prev;
          }
        }
        const id = nextIdRef.current;
        nextIdRef.current += 1;
        toastId = id;
        return [...prev, { id, message, type, duration }];
      });
      return toastId;
    },
    []
  );

  const showSuccess = useCallback(
    (message: string): number | null => {
      return showToast(message, "success");
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string): number | null => {
      return showToast(message, "error");
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string): number | null => {
      return showToast(message, "warning");
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string): number | null => {
      return showToast(message, "info");
    },
    [showToast]
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const removeToastByMessage = useCallback((message: string, type?: ToastType) => {
    setToasts((prev) => {
      if (type) {
        return prev.filter((toast) => !(toast.message === message && toast.type === type));
      }
      return prev.filter((toast) => toast.message !== message);
    });
  }, []);

  const markAsClosing = useCallback((id: number) => {
    // アニメーション開始をマーク
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, isClosing: true } : toast
      )
    );
  }, []);

  const removeToastDelayed = useCallback((id: number, delay: number) => {
    // 遅延削除（アニメーション完了後に削除）
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, delay);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    removeToastByMessage,
    markAsClosing,
    removeToastDelayed,
  };
};
