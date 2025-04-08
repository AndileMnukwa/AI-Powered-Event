import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AuthContext } from "../helpers/AuthContext";
import { format } from "date-fns";

export default function Event() {
  // Custom colors
  const primaryColor = "#1A2A56"; // Navy blue (updated to match Home page)
  const accentColor = "#FF6B6B";  // Coral red (matches Home page)

  // Color palette - adding full palette to match Home and CreateEvent pages
  const colors = {
    navy: "#1A2A56",
    navyLight: "#2A3A66",
    pink: "#FF6B6B",
    pinkLight: "#FF6B6B",
    white: "#FFFFFF",
    lightGray: "#F5F7FA",
    gray: "#E2E8F0",
    darkGray: "#718096",
    errorRed: "#FF4D6A",
    successGreen: "#2DD4BF",
  };

  // Footer styles definitions (moved to the top to avoid ESLint warnings)
  const footerStyle = {
    backgroundColor: colors.navy,
    color: colors.white,
    padding: "1.5rem",
    textAlign: "center",
    width: "100%",
    boxShadow: "0 -5px 10px rgba(0,0,0,0.05)",
  };

  const footerContentStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "800px",
    margin: "0 auto",
  };

  const footerTextStyle = {
    margin: "0.5rem 0",
    fontSize: "0.9rem",
    color: colors.lightGray,
  };

  const footerLinkStyle = {
    color: colors.pinkLight,
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.3s ease",
  };

  const footerIconStyle = {
    color: colors.pink,
    marginRight: "0.5rem",
    verticalAlign: "middle",
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authState } = useContext(AuthContext);
  const [isEventPast, setIsEventPast] = useState(false);

  // Social sharing states
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingProvider, setSharingProvider] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [oauthPopup, setOauthPopup] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(null);
  const oauthCallbackRef = useRef();
  const socialShareTimeoutRef = useRef();

  // Function to correct the image path (same as Home page)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If the path already starts with http, return as is
    if (imagePath.startsWith('http')) return imagePath;

    // If the path begins with "/uploads/events/", ensure it's properly formed
    if (imagePath.startsWith('/uploads/events/')) {
      return `https://ai-powered-event-production.up.railway.app${imagePath}`;
    }

    // For any other case, just append the path to the base URL
    return `https://ai-powered-event-production.up.railway.app/${imagePath}`;
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`https://ai-powered-event-production.up.railway.app/${id}`);
        if (response.data.event) {
          setEventData(response.data.event);

          // Check if the event is in the past
          const eventDate = new Date(response.data.event.date);
          const now = new Date();
          setIsEventPast(eventDate < now);
        } else {
          setEventData(null);
          setError("Event not found.");
        }
        if (response.data.reviews) {
          setReviews(response.data.reviews);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to load event details.");
        setLoading(false);
        console.error("Error fetching event details:", err);
      }
    };
    fetchEventDetails();
  }, [id]);

  // Wrap shareToSocialMedia in useCallback to prevent re-creation on each render
  const shareToSocialMedia = useCallback(async (provider, token) => {
    try {
      setIsAuthenticating(true);

      // Create an image card for the event (if available)
      const eventImage = eventData?.image ? getImageUrl(eventData.image) : null;

      // Create the share content
      const shareContent = {
        provider,
        message: shareMessage,
        url: window.location.href,
        eventId: id,
        eventTitle: eventData?.title,
        eventDescription: eventData?.description,
        eventDate: eventData?.date,
        eventImage: eventImage,
        rating: rating
      };

      // Send share request to backend
      const response = await axios.post(
        `https://ai-powered-event-production.up.railway.app/social/share`,
        shareContent,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsAuthenticating(false);

      // Show success message
      if (response.data.success) {
        setShareSuccess({
          success: true,
          provider,
          message: `Successfully shared to ${provider}!`,
          shareId: response.data.shareId || null
        });

        // Clear success message after some time
        socialShareTimeoutRef.current = setTimeout(() => {
          setShareSuccess(null);
        }, 5000);
      } else {
        setShareSuccess({
          success: false,
          provider,
          message: `Failed to share to ${provider}: ${response.data.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error(`Error sharing to ${provider}:`, error);
      setIsAuthenticating(false);
      setShareSuccess({
        success: false,
        provider,
        message: `Error sharing to ${provider}: ${error.response?.data?.message || error.message}`
      });
    }
  }, [eventData, shareMessage, id, rating]); // Dependencies inside useCallback

  // Now, the useEffect hook
  useEffect(() => {
    const handleOAuthCallback = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'oauth-callback') {
        const { provider, success, token } = event.data;

        if (success && token) {
          sessionStorage.setItem(`${provider}Token`, token);

          if (oauthPopup && !oauthPopup.closed) {
            oauthPopup.close();
          }

          shareToSocialMedia(provider, token);
        } else {
          setIsAuthenticating(false);
          setShareSuccess({ success: false, provider, message: `Authentication with ${provider} failed.` });
        }
      }
    };

    window.addEventListener('message', handleOAuthCallback);
    oauthCallbackRef.current = handleOAuthCallback;

    return () => {
      window.removeEventListener('message', oauthCallbackRef.current);

      if (socialShareTimeoutRef.current) {
        clearTimeout(socialShareTimeoutRef.current);
      }
    };
  }, [oauthPopup, shareToSocialMedia]); // Now shareToSocialMedia is defined before it is used

  const addReview = useCallback(async () => {
    if (!newReview.trim() || rating === 0) {
      alert("Please provide both a review and a rating.");
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("You must be logged in to add a review.");
      return;
    }

    try {
      let sentiment = "neutral";
      try {
        const { data: sentimentData } = await axios.post("https://ai-powered-event-production.up.railway.app/sentiment", { text: newReview });
        sentiment = sentimentData.sentiment;
      } catch (err) {
        console.warn("Sentiment API not found, skipping sentiment analysis.");
      }

      const { data: reviewResponse } = await axios.post(
        "https://ai-powered-event-production.up.railway.app/reviews",
        { review_text: newReview, rating, eventId: id, sentiment },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (reviewResponse.error) {
        alert(reviewResponse.error);
      } else {
        setReviews((prevReviews) => [...prevReviews, reviewResponse.review]);
        setNewReview("");
        setRating(0);

        // Create notification for admins about the new review
        try {
          await axios.post(
            "https://ai-powered-event-production.up.railway.app/notifications",
            {
              message: `New review for event "${eventData?.title}"`,
              type: "review",
              relatedId: id,
              forAdmins: true, // Send to all admins
            },
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
        }

        // Reset share success state
        setShareSuccess(null);

        // Open sharing modal
        setShowShareModal(true);

        // Set default share message
        const defaultShareMessage = `I just reviewed "${eventData?.title}" with ${rating} stars! Check out this event at: ${window.location.href}`;
        setShareMessage(defaultShareMessage);
      }
    } catch (err) {
      console.error("Error adding review:", err);
      alert("There was an error adding your review. Please try again.");
    }
  }, [newReview, rating, id, eventData?.title]);

  const initiateOAuth = (provider) => {
    setSharingProvider(provider);
    setIsAuthenticating(true);
    setShareSuccess(null);

    // Set OAuth endpoints
    const oauthEndpoints = {
      facebook: 'https://ai-powered-event-production.up.railway.app/auth/facebook',
      linkedin: 'https://ai-powered-event-production.up.railway.app/auth/linkedin',
      twitter: 'https://ai-powered-event-production.up.railway.app/auth/twitter'
    };

    // Calculate popup position to be centered
    const width = 600;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    // Open the popup
    const popup = window.open(
      oauthEndpoints[provider],
      `${provider}OAuth`,
      `width=${width},height=${height},top=${top},left=${left}`
    );

    setOauthPopup(popup);

    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setIsAuthenticating(false);
      setShareSuccess({
        success: false,
        provider,
        message: "Popup blocked! Please allow popups for this site to use social sharing."
      });
    }
  };

  const handleShareSubmit = (provider) => {
    // Check if we already have a token for this provider
    const existingToken = sessionStorage.getItem(`${provider}Token`);

    if (existingToken) {
      // If we have a token, use it directly
      shareToSocialMedia(provider, existingToken);
    } else {
      // Otherwise, initiate OAuth flow
      initiateOAuth(provider);
    }
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSharingProvider(null);
    setIsAuthenticating(false);
    setShareSuccess(null);
  };

  const deleteReview = useCallback(async (reviewId) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("You must be logged in to delete a review.");
      return;
    }

    try {
      await axios.delete(`https://ai-powered-event-production.up.railway.app/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      alert("Review deleted successfully!");
      setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
    } catch (err) {
      alert("There was an error deleting your review. Please try again.");
    }
  }, []);

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("You must be logged in to delete an event.");
      return;
    }

    try {
      await axios.delete(`https://ai-powered-event-production.up.railway.app/events/${eventId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Store the success message in sessionStorage
      sessionStorage.setItem("eventDeleteSuccess", "Event deleted successfully");

      // Redirect to the home page
      window.location.href = "/";
    } catch (error) {
      if (error.response) {
        console.error("Error details:", error.response.data);

        if (error.response.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("accessToken");
          sessionStorage.clear();
          document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          window.location.replace("/login");
        } else if (error.response.status === 403) {
          alert("You are not authorized to delete this event.");
        } else {
          alert("Failed to delete the event. Please try again.");
        }
      } else {
        alert("Network error. Please try again.");
      }
    }
  };

  // Handle event registration
  const handleRegistration = () => {
    // Navigate to the registration page
    navigate(`/register/${id}`);
  };

  // Render loading state
  if (loading) return (
    <>
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh", paddingTop: "70px", paddingBottom: "200px" }}>
        <div className="spinner-border" role="status" style={{ color: accentColor }}>
          <span className="visually-hidden">Loading event details...</span>
        </div>
      </div>

      {/* Footer with accessibility-compliant links */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <i className="fas fa-heart" style={footerIconStyle}></i> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <button
              onClick={() => navigate("/terms")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Terms
            </button> •
            <button
              onClick={() => navigate("/privacy")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", margin: "0 0.5rem", padding: 0 }}
            >
              Privacy
            </button> •
            <button
              onClick={() => navigate("/support")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Support
            </button>
          </p>
          <p style={{ ...footerTextStyle, marginTop: "0.5rem", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );

  // Render error state
  if (error) return (
    <>
      <div className="container text-center mt-5" style={{ paddingTop: "70px", paddingBottom: "200px" }}>
        <div className="alert" style={{ backgroundColor: accentColor, color: "white" }}>
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </div>
        <button
          className="btn mt-3"
          onClick={() => navigate("/")}
          style={{ backgroundColor: primaryColor, color: "white" }}
        >
          <i className="fas fa-home me-2"></i>Back to Home
        </button>
      </div>

      {/* Footer with accessibility-compliant links */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <i className="fas fa-heart" style={footerIconStyle}></i> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <button
              onClick={() => navigate("/terms")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Terms
            </button> •
            <button
              onClick={() => navigate("/privacy")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", margin: "0 0.5rem", padding: 0 }}
            >
              Privacy
            </button> •
            <button
              onClick={() => navigate("/support")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Support
            </button>
          </p>
          <p style={{ ...footerTextStyle, marginTop: "0.5rem", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );

  // Footer styles moved to the top of the component

  return (
    <>
      <div className="container mt-5" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Event Header Section */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center"
            style={{ backgroundColor: primaryColor, color: "white" }}>
            <h2 className="mb-0 fs-4">
              <i className="fas fa-calendar-event me-2"></i>
              {eventData?.title || "Event Title"}
            </h2>
            <div>
              <span className="badge me-2" style={{ backgroundColor: accentColor, fontSize: "0.9rem" }}>
                {eventData?.category || "Uncategorized"}
              </span>
              <span className="badge" style={{ backgroundColor: accentColor, fontSize: "0.9rem" }}>
                <i className="far fa-clock me-1"></i>
                {eventData?.date ? format(new Date(eventData.date), "MMM dd, yyyy") : "Date not provided"}
              </span>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Event Image and Details Section */}
          <div className="col-lg-5 mb-4">
            {/* Event Image - NEW */}
            {eventData?.image && (
              <div className="card mb-4 shadow-sm">
                <div className="card-body p-0">
                  <img
                    src={getImageUrl(eventData.image)}
                    alt={eventData.title}
                    className="img-fluid rounded"
                    style={{ width: "100%", height: "300px", objectFit: "cover" }}
                  />
                </div>
              </div>
            )}

            {/* Event Details Card */}
            <div className="card h-100 shadow-sm">
              <div className="card-header" style={{ backgroundColor: "#F8F9FA" }}>
                <h3 className="mb-0 fs-5" style={{ color: primaryColor }}>
                  <i className="fas fa-info-circle me-2" style={{ color: accentColor }}></i>
                  Event Details
                </h3>
              </div>
              <div className="card-body">
                <div className="mb-3 pb-3 border-bottom">
                  <h4 className="fs-6" style={{ color: accentColor }}>Description</h4>
                  <p>{eventData?.description || "No description available"}</p>
                </div>

                <div className="mb-3 pb-3 border-bottom">
                  <h4 className="fs-6" style={{ color: accentColor }}>Date & Time</h4>
                  <p>
                    <i className="fas fa-calendar-day me-2"></i>
                    {eventData?.date ? format(new Date(eventData.date), "MMMM dd, yyyy") : "Date not provided"}
                  </p>
                  <p>
                    <i className="fas fa-clock me-2"></i>
                    {eventData?.time ? format(new Date(`2000-01-01T${eventData.time}`), "h:mm a") : "Time not specified"}
                  </p>

                  {/* Event Status Badge */}
                  <div className="mt-2">
                    <span className="badge" style={{
                      backgroundColor: isEventPast ? "#6c757d" : "#28a745",
                      color: "white",
                      padding: "0.5rem",
                      fontSize: "0.9rem"
                    }}>
                      <i className={`fas ${isEventPast ? "fa-history" : "fa-calendar-check"} me-2`}></i>
                      {isEventPast ? "Past Event" : "Upcoming Event"}
                    </span>
                  </div>

                  {/* Ticket price section - only shown for paid events */}
                  {eventData?.isPaid && (
                    <div className="mt-3">
                      <h4 className="fs-6" style={{ color: accentColor }}>Price</h4>
                      <p>
                        <i className="fas fa-dollar-sign me-2"></i>
                        ${parseFloat(eventData.price).toFixed(2)} per ticket
                      </p>
                      {eventData?.ticketsAvailable > 0 && (
                        <p>
                          <i className="fas fa-ticket-alt me-2"></i>
                          {eventData.ticketsAvailable} tickets available
                        </p>
                      )}
                      {eventData?.registrationDeadline && (
                        <p>
                          <i className="fas fa-calendar-times me-2"></i>
                          Registration deadline: {format(new Date(eventData.registrationDeadline), "MMMM dd, yyyy")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Registration limits - show regardless of paid/free status */}
                  {(eventData?.minRegistrations > 1 || eventData?.maxRegistrations) && (
                    <div className="mt-3">
                      <h4 className="fs-6" style={{ color: accentColor }}>Registration Limits</h4>
                      {eventData?.minRegistrations > 1 && (
                        <p>
                          <i className="fas fa-user-plus me-2"></i>
                          Minimum Registrations: {eventData.minRegistrations}
                        </p>
                      )}
                      {eventData?.maxRegistrations && (
                        <p>
                          <i className="fas fa-users me-2"></i>
                          Maximum Registrations: {eventData.maxRegistrations}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-3 pb-3 border-bottom">
                  <h4 className="fs-6" style={{ color: accentColor }}>Location</h4>
                  <p><i className="fas fa-map-marker-alt me-2"></i>{eventData?.location || "Location not specified"}</p>
                </div>

                <div>
                  <h4 className="fs-6" style={{ color: accentColor }}>Organizer</h4>
                  <p><i className="fas fa-user me-2"></i>{eventData?.username || "Anonymous"}</p>
                </div>

                {/* Registration Button for upcoming events */}
                {!isEventPast && (
                  <div className="mt-4 text-center">
                    <button
                      className="btn btn-lg"
                      onClick={handleRegistration}
                      style={{
                        backgroundColor: accentColor,
                        color: "white",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        transition: "all 0.3s ease"
                      }}
                    >
                      <i className="fas fa-ticket-alt me-2"></i>
                      Register Now
                    </button>
                  </div>
                )}
              </div>

              {eventData?.username && authState.username === eventData.username && (
                <div className="card-footer bg-white text-end border-top-0">
                  <button
                    className="btn"
                    onClick={() => deleteEvent(eventData.id)}
                    style={{ backgroundColor: accentColor, color: "white" }}
                  >
                    <i className="fas fa-trash me-2"></i>Delete Event
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section - Only show for past events */}
          <div className="col-lg-7">
            {isEventPast ? (
              <>
                {/* Add Review Form */}
                <div className="card mb-4 shadow-sm">
                  <div className="card-header" style={{ backgroundColor: "#F8F9FA" }}>
                    <h3 className="mb-0 fs-5" style={{ color: primaryColor }}>
                      <i className="fas fa-star me-2" style={{ color: accentColor }}></i>
                      Write a Review
                    </h3>
                  </div>
                  <div className="card-body">
                    <textarea
                      className="form-control"
                      placeholder="Share your experience with this event..."
                      value={newReview}
                      onChange={(event) => setNewReview(event.target.value)}
                      rows="3"
                      style={{ borderColor: primaryColor, borderRadius: "8px" }}
                    />

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <label className="me-2">Your Rating:</label>
                        {[1, 2, 3, 4, 5].map((index) => (
                          <i
                            key={index}
                            onClick={() => setRating(index)}
                            className={`fa-star fa-lg me-1 ${index <= rating ? "fas" : "far"}`}
                            style={{
                              cursor: "pointer",
                              color: index <= rating ? "#FFD700" : "#aaa"
                            }}
                            aria-label={`Rate ${index} stars`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={addReview}
                        className="btn"
                        disabled={!newReview.trim() || rating === 0}
                        style={{
                          backgroundColor: primaryColor,
                          color: "white",
                          opacity: (!newReview.trim() || rating === 0) ? 0.65 : 1
                        }}
                      >
                        <i className="fas fa-paper-plane me-2"></i>
                        Submit Review
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="card shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: "#F8F9FA" }}>
                    <h3 className="mb-0 fs-5" style={{ color: primaryColor }}>
                      <i className="fas fa-comments me-2" style={{ color: accentColor }}></i>
                      Event Reviews
                    </h3>
                    <span className="badge" style={{ backgroundColor: primaryColor, color: "white" }}>
                      {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                    </span>
                  </div>

                  <div className="card-body">
                    {reviews.length > 0 ? (
                      <div className="review-list">
                        {reviews.map((review) => (
                          <div key={review.id} className="card mb-3 border-0 shadow-sm">
                            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                              <div>
                                <strong><i className="fas fa-user-circle me-2" style={{ color: accentColor }}></i>{review.username || "Anonymous"}</strong>
                                <span className="ms-3">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <i
                                      key={i}
                                      className="fas fa-star"
                                      style={{
                                        color: i < review.rating ? '#FFD700' : '#E0E0E0',
                                        fontSize: "0.9rem"
                                      }}
                                    />
                                  ))}
                                </span>
                                {review.sentiment && (
                                  <span className="ms-2 badge" style={{
                                    backgroundColor:
                                      review.sentiment === "positive" ? "#4CAF50" :
                                        review.sentiment === "negative" ? "#F44336" :
                                          "#9E9E9E",
                                    fontSize: "0.75rem"
                                  }}>
                                    {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                                  </span>
                                )}
                                <small className="text-muted ms-3">
                                  {review.createdAt ? format(new Date(review.createdAt), "MMM dd, yyyy") : ""}
                                </small>
                              </div>

                              {authState.username === review.username && (
                                <button
                                  className="btn btn-sm"
                                  onClick={() => deleteReview(review.id)}
                                  style={{
                                    backgroundColor: accentColor,
                                    color: "white",
                                    padding: "2px 8px"
                                  }}
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              )}
                            </div>

                            <div className="card-body">
                              <p className="card-text">{review.review_text || "No review text available"}</p>

                              {review.admin_response && (
                                <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#F8F9FA" }}>
                                  <p className="mb-1">
                                    <strong>
                                      <i className="fas fa-reply me-2" style={{ color: primaryColor }}></i>
                                      Admin Response:
                                    </strong>
                                  </p>
                                  <p className="mb-0 ms-4">{review.admin_response}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-comment-slash fa-3x mb-3" style={{ color: accentColor }}></i>
                        <p style={{ color: primaryColor }}>No reviews for this event yet. Be the first to share your experience!</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // For upcoming events, show an alternate component in place of reviews
              <div className="card shadow-sm">
                <div className="card-header" style={{ backgroundColor: "#F8F9FA" }}>
                  <h3 className="mb-0 fs-5" style={{ color: primaryColor }}>
                    <i className="fas fa-info-circle me-2" style={{ color: accentColor }}></i>
                    Event Information
                  </h3>
                </div>
                <div className="card-body">
                  <div className="text-center py-4">
                    <i className="fas fa-calendar-day fa-3x mb-3" style={{ color: accentColor }}></i>
                    <h4 style={{ color: primaryColor }}>This is an upcoming event</h4>
                    <p className="text-muted">Reviews can only be submitted after the event has taken place.</p>

                    <div className="mt-4 mb-3">
                      <p className="fw-bold">What to expect:</p>
                      <ul className="list-group list-group-flush text-start">
                        <li className="list-group-item"><i className="fas fa-check-circle me-2" style={{ color: accentColor }}></i>Connect with other attendees</li>
                        <li className="list-group-item"><i className="fas fa-check-circle me-2" style={{ color: accentColor }}></i>Learn from industry experts</li>
                        <li className="list-group-item"><i className="fas fa-check-circle me-2" style={{ color: accentColor }}></i>Expand your professional network</li>
                        <li className="list-group-item"><i className="fas fa-check-circle me-2" style={{ color: accentColor }}></i>Share your insights and experiences</li>
                      </ul>
                    </div>

                    <button
                      className="btn mt-4"
                      onClick={handleRegistration}
                      style={{
                        backgroundColor: accentColor,
                        color: "white",
                        padding: "0.75rem 2rem",
                        borderRadius: "8px",
                        fontSize: "1.1rem",
                        fontWeight: "500"
                      }}
                    >
                      <i className="fas fa-ticket-alt me-2"></i>
                      Register for This Event
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Share Modal */}
        {showShareModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: primaryColor, color: 'white' }}>
                  <h5 className="modal-title">
                    <i className="fas fa-share-alt me-2"></i>
                    Share Your Review
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeShareModal}
                    disabled={isAuthenticating}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Your review has been submitted successfully! Would you like to share this event on social media?</p>

                  <div className="form-group mb-3">
                    <label htmlFor="shareMessage" className="form-label">
                      Share Message:
                      <small className="text-muted ms-2">
                        Customize your message for social media
                      </small>
                    </label>
                    <textarea
                      id="shareMessage"
                      className="form-control"
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      rows="3"
                      style={{ borderColor: primaryColor }}
                    />
                  </div>

                  {/* Share Success/Error Message */}
                  {shareSuccess && (
                    <div className={`alert ${shareSuccess.success ? 'alert-success' : 'alert-danger'} mb-3`}>
                      {shareSuccess.success ? (
                        <i className="fas fa-check-circle me-2"></i>
                      ) : (
                        <i className="fas fa-exclamation-circle me-2"></i>
                      )}
                      {shareSuccess.message}
                    </div>
                  )}

                  <div className="d-flex justify-content-center flex-wrap gap-2 mb-3">
                    <button
                      className="btn"
                      onClick={() => handleShareSubmit('facebook')}
                      disabled={isAuthenticating}
                      style={{
                        backgroundColor: '#4267B2',
                        color: 'white',
                        width: '140px'
                      }}
                    >
                      <i className="fab fa-facebook me-2"></i>
                      Facebook
                    </button>

                    <button
                      className="btn"
                      onClick={() => handleShareSubmit('linkedin')}
                      disabled={isAuthenticating}
                      style={{
                        backgroundColor: '#0077B5',
                        color: 'white',
                        width: '140px'
                      }}
                    >
                      <i className="fab fa-linkedin me-2"></i>
                      LinkedIn
                    </button>

                    <button
                      className="btn"
                      onClick={() => handleShareSubmit('twitter')}
                      disabled={isAuthenticating}
                      style={{
                        backgroundColor: '#1DA1F2',
                        color: 'white',
                        width: '140px'
                      }}
                    >
                      <i className="fab fa-twitter me-2"></i>
                      Twitter
                    </button>
                  </div>

                  {isAuthenticating && (
                    <div className="text-center py-2">
                      <div className="spinner-border" role="status" style={{ color: primaryColor }}>
                        <span className="visually-hidden">Authenticating...</span>
                      </div>
                      <p className="mt-2">Connecting to {sharingProvider}...</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeShareModal}
                    disabled={isAuthenticating}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with accessibility-compliant links */}
      <footer style={{
        ...footerStyle,
        position: "relative",
        marginTop: "50px",
        bottom: 0,
        left: 0,
        right: 0
      }}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <i className="fas fa-heart" style={footerIconStyle}></i> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <button
              onClick={() => navigate("/terms")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Terms
            </button> •
            <button
              onClick={() => navigate("/privacy")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", margin: "0 0.5rem", padding: 0 }}
            >
              Privacy
            </button> •
            <button
              onClick={() => navigate("/support")}
              style={{ ...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Support
            </button>
          </p>
          <p style={{ ...footerTextStyle, marginTop: "0.5rem", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}