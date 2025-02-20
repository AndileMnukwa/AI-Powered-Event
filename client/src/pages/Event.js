import React, { useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AuthContext } from "../helpers/AuthContext";

export default function Event() {
  const { id } = useParams();
  const [eventData, setEventData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authState } = useContext(AuthContext);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/events/${id}`);
        if (response.data.event) {
          setEventData(response.data.event);
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
        const { data: sentimentData } = await axios.post(
          "http://localhost:3001/sentiment",
          { text: newReview }
        );
        sentiment = sentimentData.sentiment;
      } catch (err) {
        console.warn("Sentiment API not found, skipping sentiment analysis.");
      }
  
      const { data: reviewResponse } = await axios.post(
        "http://localhost:3001/reviews",
        { review_text: newReview, rating, eventId: id, sentiment },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      if (reviewResponse.error) {
        alert(reviewResponse.error);
      } else {
        setReviews((prevReviews) => [...prevReviews, reviewResponse.review]);
        setNewReview("");
        setRating(0);
        alert("Your review was added successfully!");
      }
    } catch (err) {
      console.error("Error adding review:", err);
      alert("There was an error adding your review. Please try again.");
    }
  }, [newReview, rating, id]);

  const deleteReview = useCallback(async (reviewId) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("You must be logged in to delete a review.");
      return;
    }
  
    try {
      await axios.delete(`http://localhost:3001/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      alert("Review deleted successfully!");
      setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
    } catch (err) {
      alert("There was an error deleting your review. Please try again.");
    }
  }, []);

  const deleteEvent = async (eventId) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("You must be logged in to delete an event.");
      return;
    }
  
    try {
      await axios.delete(`http://localhost:3001/events/${eventId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      alert("Event deleted successfully");
      window.location.href = "/"; // Redirect to home page
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("accessToken");
          window.location.href = "/login"; // Redirect only on 401
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

  if (loading) return <p className="text-center mt-5">Loading event details...</p>;
  if (error) return <p className="text-center mt-5 text-danger">{error}</p>;

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-header bg-primary text-white">Event Details</div>
            <div className="card-body">
              <h5 className="card-title">{eventData?.title || "Event Title"}</h5>
              <p className="card-text"><strong>Description:</strong> {eventData?.description || "No description available"}</p>
              <p className="card-text"><strong>Location:</strong> {eventData?.location || "Location not specified"}</p>
              <p className="card-text"><strong>Date:</strong> {eventData?.date || "Date not provided"}</p>
            </div>
            <div className="card-footer text-muted">
              Posted By: {eventData?.username || "Anonymous"}
              {eventData?.username && authState.username === eventData.username && (
                <button className="btn btn-danger btn-sm ml-2" onClick={() => deleteEvent(eventData.id)}>Delete Event</button>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-header bg-success text-white">Reviews</div>
            <div className="card-body">
              <textarea
                className="form-control mb-2"
                placeholder="Write a review..."
                value={newReview}
                onChange={(event) => setNewReview(event.target.value)}
              />
              <div className="form-group mt-3">
                <label htmlFor="rating">Rating:</label>
                <div id="rating">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <i
                      key={index}
                      onClick={() => setRating(index)}
                      className={`fa-star fa-lg me-1 ${index <= rating ? "fas text-warning" : "far text-secondary"}`}
                      style={{ cursor: "pointer" }}
                      aria-label={`Rate ${index} stars`}
                    />
                  ))}
                </div>
              </div>

              <button onClick={addReview} className="btn btn-success mt-3">Add a Review</button>
            </div>
          </div>

          <div className="ListOfReviews mt-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="alert alert-secondary">
                  <p><strong>{review.username || "Anonymous"}</strong> wrote:</p>
                  {authState.username === review.username && (
                    <button className="btn btn-danger btn-sm" onClick={() => deleteReview(review.id)}>🗑️</button>
                  )}
                  <p>{review.review_text || "No review text available"}</p>
                  {review.rating ? (
                    <p>{Array.from({ length: review.rating }, (_, i) => (<span key={i} style={{ color: "gold", fontSize: "1.5rem" }}>⭐</span>))}</p>
                  ) : (
                    <p>No rating provided</p>
                  )}
                  {review.sentiment && (
                    <p>
                      <strong>Sentiment:</strong> 
                      <span className={`text-${review.sentiment === 'positive' ? 'success' : review.sentiment === 'negative' ? 'danger' : 'secondary'}`}>
                        {review.sentiment}
                      </span>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
