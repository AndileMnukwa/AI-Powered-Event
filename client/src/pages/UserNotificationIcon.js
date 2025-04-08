import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { AuthContext } from "../helpers/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import API from "../services/api";
import config from "../config";

const UserNotificationIcon = () => {
  const { authState } = useContext(AuthContext);
  const [userNotifications, setUserNotifications] = useState([]);
  const [unreadUserCount, setUnreadUserCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && buttonRef.current !== event.target) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authState.status) return;

    const fetchUserNotifications = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        const response = await API.get("/notifications", {
          headers: { Authorization: `Bearer ${accessToken}` },
       });

        if (response.ok) {
          const data = response.data;

          // Get read notification IDs from localStorage
          const readNotificationIds = JSON.parse(localStorage.getItem("readNotifications") || "[]");

          // Mark notifications as read if they're in localStorage
          const updatedNotifications = data.map((notification) => ({
            ...notification,
            isRead: notification.isRead || readNotificationIds.includes(notification.id),
          }));

          setUserNotifications(updatedNotifications);
          setUnreadUserCount(updatedNotifications.filter((n) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchUserNotifications();

    socketRef.current = io(config.API_BASE_URL);

    socketRef.current.on("connect", () => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken && authState.id) {
        socketRef.current.emit("authenticate", { token: accessToken, userId: authState.id });
        socketRef.current.emit("join-user-room", authState.id);
      }
    });

    socketRef.current.on("user-notification", (notification) => {
      // Play notification sound
      try {
        const notificationSound = new Audio("/notification-sound.mp3");
        notificationSound.play().catch(err => console.log("Audio play error:", err));
      } catch (e) {
        console.log("Audio error:", e);
      }
      
      setUserNotifications((prev) => (prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev]));
      setUnreadUserCount((prev) => prev + 1);
    });

    return () => socketRef.current && socketRef.current.disconnect();
  }, [authState.status, authState.id]);

  const markUserNotificationAsRead = async (notification) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await API.put(`/notifications/${notification.id}/read`, null, { // Use API.put, null body for PUT, relative path
        headers: { Authorization: `Bearer ${accessToken}` },
     });

     if (response.status === 200) {
        // Update state
        setUserNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
        setUnreadUserCount((prev) => Math.max(0, prev - 1));

        // Store read status in localStorage
        const readNotificationIds = JSON.parse(localStorage.getItem("readNotifications") || "[]");
        if (!readNotificationIds.includes(notification.id)) {
          localStorage.setItem("readNotifications", JSON.stringify([...readNotificationIds, notification.id]));
        }
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await API.put(`/notifications/read-all`, null, {
        headers: { Authorization: `Bearer ${accessToken}` },
     });

     if (response.status === 200) {
        // Get all notification IDs
        const allNotificationIds = userNotifications.map((n) => n.id);

        // Update state
        setUserNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadUserCount(0);

        // Store all notification IDs in localStorage
        localStorage.setItem("readNotifications", JSON.stringify(allNotificationIds));
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };
  
  const handleNotificationClick = (notification) => {
    markUserNotificationAsRead(notification);
    setShowDropdown(false);
    
    // Navigate based on notification type
    if (notification.type === "event") {
      navigate(`/event/${notification.relatedId}`);
    } else if (notification.type === "review_response") {
      navigate(`/event/${notification.relatedId}`);
    } else if (notification.type === "general") {
      // For general notifications, you might want to navigate to a default page or stay on the current page
      // navigate('/home');
    }
  };

  return (
    <div className="position-relative">
      <button
        ref={buttonRef}
        className="btn btn-light position-relative"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        <i className="bi bi-bell-fill fs-5"></i>
        {unreadUserCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadUserCount > 99 ? "99+" : unreadUserCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="dropdown-menu dropdown-menu-end shadow-sm p-2 show"
          style={{
            width: "320px",
            position: "absolute",
            right: 0,
            top: "100%",
            zIndex: 1050,
          }}
        >
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
            <span className="fw-bold">Notifications</span>
            {unreadUserCount > 0 && (
              <button className="btn btn-sm btn-link text-decoration-none" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="list-group list-group-flush" style={{ maxHeight: "300px", overflowY: "auto" }}>
            {userNotifications.length === 0 ? (
              <div className="text-center text-muted py-3">No notifications</div>
            ) : (
              userNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${notification.isRead ? "bg-white" : "bg-light"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="w-100">
                    <p className="mb-1 text-truncate" title={notification.message}>
                      {notification.message}
                    </p>
                    <small className="text-muted">{new Date(notification.createdAt).toLocaleTimeString()}</small>
                  </div>
                  {!notification.isRead && <span className="badge bg-primary rounded-pill">New</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNotificationIcon;