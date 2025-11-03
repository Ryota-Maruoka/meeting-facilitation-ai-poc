"use client";

import React, { useEffect, useRef } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: number;
  message: string;
  type?: ToastType;
  duration?: number;
  isClosing?: boolean;
  onMarkAsClosing: () => void;
  onRemoveDelayed: (delay: number) => void;
  index?: number;
}

/**
 * トースト通知コンポーネント
 *
 * 画面右上に数秒間表示される通知メッセージ
 * 指定時間経過後、スライドアウトアニメーションを表示してから閉じる
 *
 * @param props.message - 表示するメッセージ
 * @param props.type - 通知タイプ（success/error/warning/info）
 * @param props.duration - 表示時間（ミリ秒、デフォルト3000ms）
 * @param props.isClosing - 閉じる中かどうか（親から渡される）
 * @param props.onMarkAsClosing - 閉じる開始をマークするコールバック
 * @param props.onRemoveDelayed - 遅延削除のコールバック
 */
const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = "info",
  duration = 3000, // デフォルトは3000ms
  isClosing: isClosingProp = false,
  onMarkAsClosing,
  onRemoveDelayed,
  index = 0,
}) => {
  // durationがundefinedの場合はデフォルト値を使用
  const actualDuration = duration ?? 3000;
  // コールバック関数の最新参照を保持（useEffectの再実行を防ぐため）
  const onMarkAsClosingRef = useRef(onMarkAsClosing);
  const onRemoveDelayedRef = useRef(onRemoveDelayed);

  // 最新のコールバック参照を更新
  useEffect(() => {
    onMarkAsClosingRef.current = onMarkAsClosing;
    onRemoveDelayedRef.current = onRemoveDelayed;
  }, [onMarkAsClosing, onRemoveDelayed]);

  useEffect(() => {
    // 既に閉じる処理が開始されている場合はタイマーを設定しない
    if (isClosingProp) {
      return;
    }

    // durationがInfinityの場合は自動で閉じない（処理中トースト用）
    if (actualDuration === Infinity) {
      return;
    }

    // 指定時間後にスライドアウトアニメーション開始
    const timer = setTimeout(() => {
      onMarkAsClosingRef.current();
      // アニメーション完了後に削除（300ms後）
      onRemoveDelayedRef.current(300);
    }, actualDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [actualDuration, isClosingProp]);

  const handleClose = () => {
    onMarkAsClosingRef.current();
    // アニメーション完了後に削除（300ms後）
    onRemoveDelayedRef.current(300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#4CAF50",
          icon: "check_circle",
        };
      case "error":
        return {
          backgroundColor: "#F44336",
          icon: "error",
        };
      case "warning":
        return {
          backgroundColor: "#FF9800",
          icon: "warning",
        };
      case "info":
      default:
        return {
          backgroundColor: "#2196F3",
          icon: "info",
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }

        .toast-container {
          position: fixed;
          right: 24px;
          z-index: 9999;
          animation: slideInRight 0.3s ease-out;
        }

        .toast-container.closing {
          animation: slideOutRight 0.3s ease-out forwards;
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          min-width: 320px;
          max-width: 500px;
        }

        .toast-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          color: white;
        }

        .toast-content {
          flex: 1;
          font-size: 14px;
          line-height: 1.5;
          color: #212121;
          word-wrap: break-word;
        }

        .toast-close {
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #757575;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast-close:hover {
          color: #212121;
        }

        .toast-close .material-icons {
          font-size: 20px;
        }
      `}</style>
      <div
        className={`toast-container ${isClosingProp ? "closing" : ""}`}
        style={{
          top: `${24 + index * 80}px`,
          zIndex: 9999 - index,
        }}
      >
        <div className="toast">
          <div
            className="toast-icon"
            style={{ backgroundColor: typeStyles.backgroundColor }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>
              {typeStyles.icon}
            </span>
          </div>
          <div className="toast-content">{message}</div>
          <button
            className="toast-close"
            onClick={handleClose}
            aria-label="閉じる"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Toast;
