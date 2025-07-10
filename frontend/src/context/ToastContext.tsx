import React, { createContext, useContext, useState, useCallback } from "react";
import ToastNotification, { ToastType } from "../components/ToastNotification";

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const [duration, setDuration] = useState(3000);

  const showToast = useCallback(
    (msg: string, toastType: ToastType, toastDuration = 3000) => {
      setMessage(msg);
      setType(toastType);
      setDuration(toastDuration);
      setVisible(true);
    },
    []
  );

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  const value = {
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastNotification
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};
