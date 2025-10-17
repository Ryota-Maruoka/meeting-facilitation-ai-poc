"use client";

import React, { useEffect } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

/**
 * トースト通知コンポーネント
 *
 * 画面右上に数秒間表示される通知メッセージ
 *
 * @param props.message - 表示するメッセージ
 * @param props.type - 通知タイプ（success/error/warning/info）
 * @param props.duration - 表示時間（ミリ秒、デフォルト3000ms）
 * @param props.onClose - 閉じる時のコールバック
 */
const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

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
          top: 24px;
          right: 24px;
          z-index: 9999;
          animation: slideInRight 0.3s ease-out;
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
      <div className="toast-container">
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
            onClick={onClose}
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
