import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { format } from "date-fns";
import API from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [adminEvents, setAdminEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("me");
  const [editMode, setEditMode] = useState(false);
  const [aboutMeText, setAboutMeText] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    eventReminders: true,
    reviewRequests: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showReviews: true,
    showEvents: true,
  });
  const [themeSettings, setThemeSettings] = useState({
    darkMode: false,
    fontSize: "medium",
  });
  const navigate = useNavigate();

  // Helper function to generate avatar initials
  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : "U";
  };
  
  // Helper function to render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`star-${i}`} style={styles.ratingStars}>★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half-star" style={styles.ratingStars}>✮</span>);
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} style={{...styles.ratingStars, color: "#e0e0e0"}}>☆</span>);
    }
    
    return stars;
  };

  // Function to correct the image path - reusing from other components
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If the path already starts with http, return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If the path begins with "/uploads/events/", remove the leading slash
    if (imagePath.startsWith('/uploads/events/')) {
      return `https://ai-powered-event-production.up.railway.app/${imagePath}`;
    }
    
    // For any other case, just append the path to the base URL
    return `https://ai-powered-event-production.up.railway.app/${imagePath}`;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("Authentication token missing");
        }

        const response = await API.get("https://ai-powered-event-production.up.railway.app/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser({
          id: response.data.id,
          username: response.data.username,
          isAdmin: response.data.isAdmin,
        });
        
        // Assuming the API returns enhanced review data with event information
        // If not, you would need to fetch events separately or modify your backend
        const enhancedReviews = response.data.reviews || [];
        setReviews(enhancedReviews.map(review => ({
          ...review,
          // Mock data for demonstration - replace with actual data from your API
          event: review.event || {
            id: review.eventId || Math.floor(Math.random() * 1000),
            name: review.eventName || `Event ${Math.floor(Math.random() * 100)}`,
            date: review.eventDate || new Date().toISOString().split('T')[0],
            location: review.eventLocation || "Virtual Event",
            category: review.eventCategory || "Conference"
          }
        })));
        
        setAboutMeText(response.data.aboutMe || "");
        setNewUsername(response.data.username || "");

        // If user is an admin, fetch their created events
        if (response.data.isAdmin) {
          fetchAdminEvents(token);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        let errorMessage = "An unexpected error occurred.";

        if (err.response) {
          if (err.response.status === 401 || err.response.status === 403) {
            errorMessage = "Your session has expired. Please log in again.";
            setTimeout(() => navigate("/login"), 2000);
          } else {
            errorMessage = `Error ${err.response.status}: ${err.response.data?.message || err.message}`;
          }
        } else if (err.message === "Authentication token missing") {
          errorMessage = "Please login.";
          setTimeout(() => navigate("/login"), 2000);
        } else {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    // Fetch events created by the admin
    const fetchAdminEvents = async (token) => {
      try {
        // This endpoint should return events created by the current user
        // You may need to adjust based on your actual API
        const response = await API.get("https://ai-powered-event-production.up.railway.app/events", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Assuming the API returns all events, filter for those created by the current user
        // Adjust based on your actual data structure
        const userEvents = response.data.filter(event => 
          event.username === user?.username || // Match by username
          event.userId === user?.id // Or match by user ID if available
        );
        
        setAdminEvents(userEvents);
      } catch (err) {
        console.error("Error fetching admin events:", err);
        // Continue silently - we'll just show empty events
      }
    };

    fetchUserProfile();
  }, [navigate, user?.id, user?.username]);

  const handleAboutMeChange = (e) => {
    setAboutMeText(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setNewUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token missing");
      }

      const profileData = {
        aboutMe: aboutMeText,
      };

      if (newUsername) {
        profileData.username = newUsername;
      }

      if (newPassword) {
        profileData.password = newPassword;
      }

      const response = await axios.put("https://ai-powered-event-production.up.railway.app/api/user/profile", profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setUser({ ...user, username: newUsername || user.username });
        setEditMode(false);
        setNewPassword("");
        alert("Profile updated successfully.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("An error occurred while saving your profile.");
    }
  };

  // Fetch event details for a specific review
  // const fetchEventForReview = async (review) => {
  //   if (!review.eventId) return null;
    
  //   try {
  //     const response = await API.get(`https://ai-powered-event-production.up.railway.app/events/${review.eventId}`);
  //     return response.data;
  //   } catch (err) {
  //     console.error(`Error fetching event for review ${review.id}:`, err);
  //     return null;
  //   }
  // };

  const toggleNotificationSetting = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });
  };

  const togglePrivacySetting = (setting) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting],
    });
  };

  const handleThemeChange = (setting, value) => {
    setThemeSettings({
      ...themeSettings,
      [setting]: value,
    });
  };

  const saveSettings = () => {
    // Here you would typically make an API call to save the settings
    // For now just show a success message
    alert("Settings saved successfully!");
  };

  const navigateToEvent = (eventId) => {
    // Navigate to event details page
    navigate(`/event/${eventId}`);
  };

  const navigateToResponse = (eventId) => {
    // Navigate to admin response page for an event
    navigate(`/response/${eventId}`);
  };

  const formatDateString = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString || "Unknown date";
    }
  };

  // Custom toggle switch component
  const ToggleSwitch = ({ isOn, onToggle }) => (
    <div style={styles.switchContainer}>
      <input
        type="checkbox"
        checked={isOn}
        onChange={onToggle}
        style={styles.switchInput}
      />
      <span
        style={{
          ...styles.switchSlider,
          backgroundColor: isOn ? "#ff6b6b" : "#ccc", // Pink when on
        }}
      >
        <span
          style={{
            ...styles.switchSliderBefore,
            transform: isOn ? "translateX(24px)" : "translateX(0)",
          }}
        />
      </span>
    </div>
  );

  // Improved color scheme and consistent styling
  const styles = {
    container: {
      backgroundColor: "#f8f9fa",
      minHeight: "100vh",
      paddingTop: "30px",
      paddingBottom: "50px",
      fontFamily: "'Roboto', sans-serif",
    },
    card: {
      border: "none",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      marginBottom: "30px",
      overflow: "hidden", // Ensures no content spills outside the rounded corners
    },
    largeProfileCard: {
      border: "none",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      marginBottom: "30px",
      overflow: "hidden",
      height: "100%", // Make card fill the height of its container
    },
    cardHeader: {
      backgroundColor: "#0a2463", // Navy
      color: "#fff",
      padding: "15px 20px",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      fontWeight: "500",
    },
    cardBody: {
      padding: "25px",
      backgroundColor: "#fff",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
    },
    profileHeader: {
      fontSize: "28px", // Increased size
      fontWeight: "bold",
      marginBottom: "20px",
      color: "#0a2463", // Navy
    },
    badge: {
      padding: "8px 12px",
      fontSize: "14px",
      borderRadius: "50px",
      backgroundColor: "#ff6b6b", // Pink
      color: "#fff",
      display: "inline-block",
      marginBottom: "8px",
      margin: "0 5px",
    },
    tabButton: {
      fontSize: "16px",
      border: "none",
      backgroundColor: "transparent",
      padding: "15px 25px",
      cursor: "pointer",
      color: "#0a2463", // Navy
      borderBottom: "2px solid transparent",
      transition: "all 0.3s ease",
      fontWeight: "500",
    },
    tabButtonActive: {
      fontSize: "16px",
      border: "none",
      backgroundColor: "transparent",
      padding: "15px 25px",
      cursor: "pointer",
      color: "#ff6b6b", // Pink
      borderBottom: "2px solid #ff6b6b", // Pink
      fontWeight: "600",
    },
    reviewItem: {
      padding: "25px",
      borderRadius: "10px",
      marginBottom: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      transition: "transform 0.2s, box-shadow 0.2s",
      border: "1px solid #eaeaea",
    },
    reviewTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#0a2463", // Navy
      marginBottom: "8px",
    },
    reviewText: {
      color: "#6c757d",
      lineHeight: "1.6",
      fontSize: "15px",
      marginBottom: "15px",
    },
    eventInfo: {
      backgroundColor: "#f8f9fa",
      padding: "12px 15px",
      borderRadius: "8px",
      marginTop: "10px",
      borderLeft: "4px solid #0a2463",
    },
    eventName: {
      fontWeight: "600",
      color: "#0a2463",
      marginBottom: "5px",
      fontSize: "16px",
      cursor: "pointer",
    },
    eventDetail: {
      color: "#6c757d",
      fontSize: "14px",
      marginBottom: "3px",
    },
    reviewDate: {
      fontStyle: "italic",
      color: "#adb5bd",
      fontSize: "14px",
      textAlign: "right",
    },
    noReviews: {
      padding: "40px 0",
      textAlign: "center",
      fontSize: "16px",
      color: "#6c757d",
    },
    textArea: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "16px",
      marginBottom: "15px",
      transition: "border 0.3s",
    },
    inputField: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "16px",
      marginBottom: "15px",
      transition: "border 0.3s",
    },
    button: {
      marginTop: "10px",
      marginRight: "10px",
      backgroundColor: "#ff6b6b", // Pink
      color: "white",
      padding: "12px 24px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontWeight: "500",
    },
    secondaryButton: {
      marginTop: "10px",
      backgroundColor: "#0a2463", // Navy
      color: "white",
      padding: "12px 24px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontWeight: "500",
    },
    settingItem: {
      padding: "15px 0",
      borderBottom: "1px solid #f0f0f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    switchContainer: {
      position: "relative",
      display: "inline-block",
      width: "50px",
      height: "26px",
    },
    switchInput: {
      opacity: 0,
      width: 0,
      height: 0,
    },
    switchSlider: {
      position: "absolute",
      cursor: "pointer",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#ccc",
      transition: "0.4s",
      borderRadius: "34px",
    },
    switchSliderBefore: {
      position: "absolute",
      content: "",
      height: "18px",
      width: "18px",
      left: "4px",
      bottom: "4px",
      backgroundColor: "white",
      transition: "0.4s",
      borderRadius: "50%",
    },
    selectField: {
      padding: "10px 15px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "16px",
      minWidth: "150px",
      backgroundColor: "#fff",
    },
    sectionHeading: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#0a2463", // Navy
      marginTop: "25px",
      marginBottom: "20px",
      paddingBottom: "10px",
      borderBottom: "1px solid #eaeaea",
    },
    tabsContainer: {
      display: "flex",
      justifyContent: "flex-start",
      marginBottom: "25px",
      borderBottom: "1px solid #e9ecef",
    },
    userInfoContainer: {
      textAlign: "center",
      padding: "30px 20px", // Increased padding
    },
    userAvatar: {
      width: "120px", // Larger avatar
      height: "120px",
      borderRadius: "50%",
      margin: "0 auto 20px",
      backgroundColor: "#e9ecef",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "36px",
      color: "#0a2463",
      fontWeight: "bold",
    },
    labelText: {
      fontWeight: "500",
      marginBottom: "8px",
      color: "#0a2463",
    },
    settingsContainer: {
      marginBottom: "30px",
    },
    aboutMeText: {
      fontSize: "16px",
      lineHeight: "1.7",
      color: "#495057",
      marginBottom: "25px",
      padding: "0 15px",
    },
    badgeContainer: {
      marginTop: "15px",
      marginBottom: "15px",
    },
    ratingStars: {
      color: "#ffc107",
      fontSize: "20px",
      marginRight: "3px",
    },
    rating: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "15px",
    },
    eventCard: {
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "20px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
    },
    eventCardImage: {
      height: "180px",
      objectFit: "cover",
      width: "100%",
    },
    eventCardImagePlaceholder: {
      height: "180px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f0f0f0",
      color: "#aaa",
      fontSize: "3rem",
    },
    eventCardContent: {
      padding: "15px",
    },
    eventCardTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#0a2463",
      marginBottom: "10px",
    },
    eventCardDetail: {
      display: "flex",
      alignItems: "center",
      marginBottom: "8px",
      color: "#6c757d",
      fontSize: "14px",
    },
    eventCardActions: {
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 15px",
      borderTop: "1px solid #f0f0f0",
    },
    eventCardCategory: {
      position: "absolute",
      top: "10px",
      right: "10px",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500",
      color: "#0a2463",
    },
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center" role="alert">
          User data not found.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div className="container py-4">
        <div className="row">
          {/* Left Sidebar: User Info - MADE LARGER */}
          <div className="col-lg-3 col-md-4 mb-4">
            <div className="card" style={styles.largeProfileCard}>
              <div className="card-header" style={styles.cardHeader}>
                <h4 className="mb-0">Profile</h4>
              </div>
              <div className="card-body" style={{...styles.cardBody, ...styles.userInfoContainer}}>
                <div style={styles.userAvatar}>
                  {getInitials(user.username)}
                </div>
                <h2 className="h3" style={styles.profileHeader}>{user.username}</h2>
                
                <div style={styles.badgeContainer}>
                  {user.isAdmin ? (
                    <span className="badge" style={{ ...styles.badge, backgroundColor: "#0a2463" }}>
                      Admin
                    </span>
                  ) : (
                    <span className="badge" style={{ ...styles.badge, backgroundColor: "#6c757d" }}>
                      User
                    </span>
                  )}
                  
                  <span className="badge d-inline-block" style={styles.badge}>
                    {reviews.length} Reviews
                  </span>
                </div>
                
                <div style={styles.rating} title="User Rating">
                  {renderStars(4.5)}
                </div>
                
                <p style={styles.aboutMeText}>
                  {aboutMeText || "No description provided. Click 'Edit Profile' to add information about yourself."}
                </p>
                
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="btn w-100" style={styles.button}>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Content: Tabs */}
          <div className="col-lg-9 col-md-8">
            {/* Tabs Header */}
            <div style={styles.tabsContainer}>
              <button
                onClick={() => setActiveTab("me")}
                style={activeTab === "me" ? styles.tabButtonActive : styles.tabButton}
              >
                Me
              </button>
              <button
                onClick={() => setActiveTab("events")}
                style={activeTab === "events" ? styles.tabButtonActive : styles.tabButton}
              >
                My Events
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                style={activeTab === "reviews" ? styles.tabButtonActive : styles.tabButton}
              >
                My Reviews
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                style={activeTab === "settings" ? styles.tabButtonActive : styles.tabButton}
              >
                Settings
              </button>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === "me" && (
                <div className="card" style={styles.card}>
                  <div className="card-header" style={styles.cardHeader}>
                    <h4 className="mb-0">Account Details</h4>
                  </div>
                  <div className="card-body" style={styles.cardBody}>
                    {editMode ? (
                      <div>
                        <h5 style={styles.sectionHeading}>Edit Profile</h5>
                        <div className="mb-3">
                          <label className="form-label" style={styles.labelText}>Username</label>
                          <input
                            type="text"
                            value={newUsername}
                            onChange={handleUsernameChange}
                            style={styles.inputField}
                            placeholder="Enter new username"
                            className="form-control"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label" style={styles.labelText}>New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={handlePasswordChange}
                            style={styles.inputField}
                            placeholder="Enter new password"
                            className="form-control"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label" style={styles.labelText}>About Me</label>
                          <textarea
                            value={aboutMeText}
                            onChange={handleAboutMeChange}
                            style={styles.textArea}
                            rows="6"
                            className="form-control"
                            placeholder="Tell others about yourself..."
                          />
                        </div>
                        <div className="d-flex">
                          <button onClick={handleSaveProfile} className="btn" style={styles.button}>
                            Save Profile
                          </button>
                          <button 
                            onClick={() => setEditMode(false)} 
                            className="btn"
                            style={{ ...styles.secondaryButton, marginLeft: "10px" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <h5 style={{color: "#6c757d"}}>
                          Edit your profile by clicking the "Edit Profile" button in the left panel.
                        </h5>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === "events" && (
                <div className="card" style={styles.card}>
                  <div className="card-header" style={styles.cardHeader}>
                    <h4 className="mb-0">My Events</h4>
                  </div>
                  <div className="card-body" style={styles.cardBody}>
                    {adminEvents.length === 0 ? (
                      <div style={styles.noReviews}>
                        {user.isAdmin 
                          ? "You haven't created any events yet."
                          : "You don't have access to create events. Only administrators can create events."}
                      </div>
                    ) : (
                      <div className="row">
                        {adminEvents.map((event) => (
                          <div className="col-md-6 col-lg-4 mb-3" key={event.id}>
                            <div className="card" style={styles.eventCard}>
                              {/* Position the category badge */}
                              {event.category && (
                                <div style={styles.eventCardCategory}>
                                  {event.category}
                                </div>
                              )}
                              
                              {/* Event image */}
                              {event.image ? (
                                <img 
                                  src={getImageUrl(event.image)}
                                  alt={event.title}
                                  className="card-img-top"
                                  style={styles.eventCardImage}
                                />
                              ) : (
                                <div style={styles.eventCardImagePlaceholder}>
                                  <i className="bi bi-image"></i>
                                </div>
                              )}
                              
                              {/* Event details */}
                              <div style={styles.eventCardContent}>
                                <h5 style={styles.eventCardTitle}>{event.title}</h5>
                                
                                <div style={styles.eventCardDetail}>
                                  <i className="bi bi-calendar me-2"></i>
                                  {formatDateString(event.date)}
                                </div>
                                
                                <div style={styles.eventCardDetail}>
                                  <i className="bi bi-clock me-2"></i>
                                  {event.time || "Time not specified"}
                                </div>
                                
                                <div style={styles.eventCardDetail}>
                                  <i className="bi bi-geo-alt me-2"></i>
                                  {event.location}
                                </div>
                                
                                <p className="mt-2 mb-1" style={{
                                  fontSize: "14px",
                                  color: "#6c757d",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical"
                                }}>
                                  {event.description}
                                </p>
                              </div>
                              
                              {/* Action buttons */}
                              <div style={styles.eventCardActions}>
                                <button 
                                  className="btn btn-sm" 
                                  onClick={() => navigateToEvent(event.id)}
                                  style={{
                                    backgroundColor: "#0a2463",
                                    color: "white"
                                  }}
                                >
                                  <i className="bi bi-eye me-1"></i> View
                                </button>
                                
                                <button 
                                  className="btn btn-sm" 
                                  onClick={() => navigateToResponse(event.id)}
                                  style={{
                                    backgroundColor: "#ff6b6b",
                                    color: "white"
                                  }}
                                >
                                  <i className="bi bi-chat-text me-1"></i> Reviews
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === "reviews" && (
                <div className="card" style={styles.card}>
                  <div className="card-header" style={styles.cardHeader}>
                    <h4 className="mb-0">My Reviews</h4>
                  </div>
                  <div className="card-body" style={styles.cardBody}>
                    {reviews.length === 0 ? (
                      <div style={styles.noReviews}>No reviews available.</div>
                    ) : (
                      <div className="review-list">
                        {reviews.map((review, index) => (
                          <div key={index} style={styles.reviewItem}>
                            <div className="d-flex justify-content-between align-items-start">
                              <h5 style={styles.reviewTitle}>{review.title || `Review #${index + 1}`}</h5>
                              <div style={{display: "flex", alignItems: "center"}}>
                                {renderStars(review.rating || 4)}
                              </div>
                            </div>
                            <p style={styles.reviewText}>{review.review_text || review.text || "No review text available."}</p>
                            
                            {/* Event information section */}
                            <div style={styles.eventInfo}>
                              <div 
                                onClick={() => review.event?.id && navigateToEvent(review.event.id)} 
                                style={styles.eventName}
                              >
                                Event: {review.event?.title || review.event?.name || "Unknown Event"}
                              </div>
                              <div style={styles.eventDetail}>
                                <strong>Date:</strong> {formatDateString(review.event?.date)}
                              </div>
                              <div style={styles.eventDetail}>
                                <strong>Location:</strong> {review.event?.location || "N/A"}
                              </div>
                              <div style={styles.eventDetail}>
                                <strong>Category:</strong> {review.event?.category || "N/A"}
                              </div>
                              {review.admin_response && (
                                <div style={{
                                  marginTop: "10px",
                                  padding: "10px",
                                  backgroundColor: "#f0f7ff",
                                  borderRadius: "6px",
                                  border: "1px solid #cce5ff"
                                }}>
                                  <strong style={{color: "#0a2463"}}>Admin Response:</strong>
                                  <p style={{margin: "5px 0 0 0", fontSize: "14px"}}>{review.admin_response}</p>
                                </div>
                              )}
                            </div>
                            
                            <div style={styles.reviewDate}>
                              Reviewed on: {formatDateString(review.date || review.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === "settings" && (
                <div className="card" style={styles.card}>
                  <div className="card-header" style={styles.cardHeader}>
                    <h4 className="mb-0">Settings</h4>
                  </div>
                  <div className="card-body" style={styles.cardBody}>
                    {/* Notifications Settings */}
                    <div style={styles.settingsContainer}>
                      <h5 style={styles.sectionHeading}>Notification Preferences</h5>
                      <div style={styles.settingItem}>
                        <span>Email Notifications</span>
                        <ToggleSwitch 
                          isOn={notificationSettings.emailNotifications} 
                          onToggle={() => toggleNotificationSetting('emailNotifications')}
                        />
                      </div>
                      <div style={styles.settingItem}>
                        <span>Push Notifications</span>
                        <ToggleSwitch 
                          isOn={notificationSettings.pushNotifications} 
                          onToggle={() => toggleNotificationSetting('pushNotifications')}
                        />
                      </div>
                      <div style={styles.settingItem}>
                        <span>Event Reminders</span>
                        <ToggleSwitch 
                          isOn={notificationSettings.eventReminders} 
                          onToggle={() => toggleNotificationSetting('eventReminders')}
                        />
                      </div>
                      <div style={styles.settingItem}>
                        <span>Review Requests</span>
                        <ToggleSwitch 
                          isOn={notificationSettings.reviewRequests} 
                          onToggle={() => toggleNotificationSetting('reviewRequests')}
                        />
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div style={styles.settingsContainer}>
                      <h5 style={styles.sectionHeading}>Privacy Settings</h5>
                      <div style={styles.settingItem}>
                        <span>Show Profile to Other Users</span>
                        <ToggleSwitch 
                          isOn={privacySettings.showProfile} 
                          onToggle={() => togglePrivacySetting('showProfile')}
                        />
                      </div>
                      <div style={styles.settingItem}>
                        <span>Make Reviews Public</span>
                        <ToggleSwitch 
                          isOn={privacySettings.showReviews} 
                          onToggle={() => togglePrivacySetting('showReviews')}
                        />
                      </div>
                      <div style={styles.settingItem}>
                        <span>Show Events I'm Attending</span>
                        <ToggleSwitch 
                          isOn={privacySettings.showEvents} 
                          onToggle={() => togglePrivacySetting('showEvents')}
                        />
                      </div>
                    </div>

                    {/* Theme Settings */}
                    <div style={styles.settingsContainer}>
                      <h5 style={styles.sectionHeading}>Display Settings</h5>
                      <div style={styles.settingItem}>
                        <span>Dark Mode</span>
                        <ToggleSwitch 
                          isOn={themeSettings.darkMode} 
                          onToggle={() => handleThemeChange('darkMode', !themeSettings.darkMode)}
                        />
                      </div>
                      <div style={styles.settingItem}>
                        <span>Font Size</span>
                        <select 
                          value={themeSettings.fontSize} 
                          onChange={(e) => handleThemeChange('fontSize', e.target.value)}
                          style={styles.selectField}
                          className="form-select"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>

                    {/* Save Settings Button */}
                    <div className="mt-4 text-end">
                      <button onClick={saveSettings} className="btn" style={styles.button}>
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;