import { useState, useCallback } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
  isClosing?: boolean;
}

/**
 * トースト通知を管理するカスタムフック
 *
 * @returns トースト状態と表示関数
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [nextId, setNextId] = useState(0);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      // 同じメッセージが既に表示されている場合は追加しない
      setToasts((prev) => {
        const isDuplicate = prev.some(
          (toast) => toast.message === message && toast.type === type
        );
        if (isDuplicate) {
          return prev;
        }
        const id = nextId;
        setNextId((prevId) => prevId + 1);
        return [...prev, { id, message, type }];
      });
    },
    [nextId]
  );

  const showSuccess = useCallback(
    (message: string) => {
      showToast(message, "success");
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      showToast(message, "error");
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => {
      showToast(message, "warning");
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      showToast(message, "info");
    },
    [showToast]
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
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
    markAsClosing,
    removeToastDelayed,
  };
};
