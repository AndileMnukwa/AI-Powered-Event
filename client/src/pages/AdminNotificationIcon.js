import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const AdminNotificationIcon = () => {
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch initial notifications
  useEffect(() => {
    const fetchAdminNotifications = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
    
        const response = await fetch("https://ai-powered-event-production.up.railway.app/notifications/admin", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched admin notifications:", data);
          setAdminNotifications(data);
          setUnreadAdminCount(data.filter((n) => !n.isRead).length);
        } else {
          console.error("Failed to fetch admin notifications:", response.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch admin notifications", error);
      }
    };

    fetchAdminNotifications();
  }, []);

  // Socket.IO setup
  useEffect(() => {
    socketRef.current = io("https://ai-powered-event-production.up.railway.app/", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      const token = localStorage.getItem("accessToken");
      if (token) {
        socketRef.current.emit("authenticate", token);
        socketRef.current.emit("join-admin-channel");
        console.log("Admin authenticated and joined admin-channel");
      }
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    // Listen for new review notifications
    socketRef.current.on("new-review", (reviewData) => {
      console.log("Received new-review event:", reviewData);

      const notification = {
        id: reviewData.reviewId || `review-${Date.now()}`,
        type: "review",
        message: `New review submitted by ${reviewData.userName || "a user"} for "${reviewData.productName}"`,
        relatedId: reviewData.reviewId,
        eventId: reviewData.eventId,
        createdAt: new Date().toISOString(),
        isRead: false,
        metadata: {
          reviewId: reviewData.reviewId,
          eventId: reviewData.eventId,
          rating: reviewData.rating,
          productName: reviewData.productName,
        },
      };

      // Prevent duplicate notifications
      setAdminNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });

      setUnreadAdminCount((prev) => prev + 1);

      // Play notification sound
      try {
        const reviewSound = new Audio("/review-notification.mp3");
        reviewSound.play().catch(err => console.log("Audio play error:", err));
      } catch (e) {
        console.log("Audio play error:", e);
      }
    });

    // Listen for admin-specific notifications
    socketRef.current.on("admin-notification", (notification) => {
      console.log("Received admin-notification:", notification);
      
      // Process notification metadata if it's a string
      if (notification.metadata && typeof notification.metadata === 'string') {
        try {
          notification.metadata = JSON.parse(notification.metadata);
        } catch (e) {
          console.error("Error parsing notification metadata:", e);
        }
      }
      
      setAdminNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      
      setUnreadAdminCount((prev) => prev + 1);
    });

    // Listen for notification read status updates
    socketRef.current.on("admin-notification-read", ({ id }) => {
      setAdminNotifications((prev) => 
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadAdminCount((prev) => Math.max(0, prev - 1));
    });

    // Listen for all notifications marked as read
    socketRef.current.on("admin-notifications-read-all", () => {
      setAdminNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadAdminCount(0);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) && 
        buttonRef.current !== event.target
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAdminNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://ai-powered-event-production.up.railway.app/notifications/admin/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setAdminNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadAdminCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark admin notification as read", error);
    }
  };

  const markAllAdminNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://ai-powered-event-production.up.railway.app/notifications/admin/read-all",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setAdminNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadAdminCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all admin notifications as read", error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAdminNotificationAsRead(notification.id);
    setShowDropdown(false);

    // Navigate based on notification type
    if (notification.type === "event") {
      navigate(`/admin/events/${notification.relatedId}`);
    } else if (notification.type === "review") {
      // For reviews, navigate to the response page
      if (notification.metadata && notification.metadata.eventId) {
        navigate(`/response/${notification.metadata.eventId}`);
      } else if (notification.eventId) {
        navigate(`/response/${notification.eventId}`);
      } else if (notification.relatedId) {
        navigate(`/response/${notification.relatedId}`);
      }
    }
  };

  return (
    <div className="position-relative">
      <button
        ref={buttonRef}
        className="btn btn-light position-relative"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Admin Notifications"
      >
        <i className="bi bi-bell-fill fs-5" style={{ color: "#001F3F" }}></i>
        {unreadAdminCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadAdminCount > 99 ? "99+" : unreadAdminCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="dropdown-menu dropdown-menu-end shadow-sm show"
          style={{
            width: "320px",
            position: "absolute",
            right: 0,
            top: "100%",
            zIndex: 1050,
          }}
        >
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
            <span className="fw-bold">Admin Notifications</span>
            {unreadAdminCount > 0 && (
              <button
                className="btn btn-sm btn-link text-decoration-none"
                onClick={markAllAdminNotificationsAsRead}
                style={{ color: "#FF6B6B" }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div
            className="list-group list-group-flush"
            style={{ maxHeight: "300px", overflowY: "auto" }}
          >
            {adminNotifications.length === 0 ? (
              <div className="text-center text-muted py-3">No admin notifications</div>
            ) : (
              adminNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${
                    notification.isRead ? "bg-white" : "bg-light"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                >
                  <div className="w-100">
                    <p className="mb-1 text-truncate" title={notification.message}>
                      {notification.message}
                    </p>
                    <small className="text-muted">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </small>
                    {notification.type === "review" && notification.metadata?.rating && (
                      <div className="mt-1">
                        <small className="text-muted">
                          Rating: {notification.metadata.rating} 
                          <span className="ms-1" style={{ color: "#FFD700" }}>
                            {"★".repeat(notification.metadata.rating)}
                          </span>
                        </small>
                        {notification.metadata.productName && (
                          <small className="text-muted d-block">
                            Event: {notification.metadata.productName}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                  {!notification.isRead && (
                    <span className="badge rounded-pill" style={{ backgroundColor: "#FF6B6B", color: "white" }}>New</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationIcon;