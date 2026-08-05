import { useEffect } from "react";
import "./Toast.css";

const ToastNotification = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification ${type}`}>
      <span className="toast-icon">
        {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
      </span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} type="button">
        ×
      </button>
    </div>
  );
};

export default ToastNotification;
