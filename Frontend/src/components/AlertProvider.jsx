import React, { useState, useCallback } from "react";
import AlertContext from "./AlertContext";

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = "info", duration = 3000) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), duration);
  }, []);

  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      {alert && (
        <div className={`global-alert ${alert.type}`}>{alert.message}</div>
      )}
      {children}
    </AlertContext.Provider>
  );
};
