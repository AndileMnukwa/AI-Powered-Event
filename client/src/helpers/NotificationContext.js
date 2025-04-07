"use client";

import { createContext, useState, useContext, useEffect } from "react";
import io from "socket.io-client";

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("https://ai-powered-event-production.up.railway.app");
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const token = localStorage.getItem("accessToken");
    if (token) {
      socket.emit("authenticate", token);
    }

    // Listen for general notifications
    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // Listen for user-specific notifications
    socket.on("user-notification", (notification) => {
      setUserNotifications((prev) => [notification, ...prev]);
    });

    // Listen for admin notifications
    socket.on("admin-notification", (notification) => {
      setAdminNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off("notification");
      socket.off("user-notification");
      socket.off("admin-notification");
    };
  }, [socket]);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch(`https://ai-powered-event-production.up.railway.app/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("https://ai-powered-event-production.up.railway.app/notifications/read-all", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        userNotifications,
        adminNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
