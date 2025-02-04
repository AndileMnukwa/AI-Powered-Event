import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Event() {
  const { id } = useParams();
  const [eventData, setEventData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0); // Start with 0 rating (unfilled stars)
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    // Fetch event data
    axios.get(`http://localhost:3001/events/${id}`)
      .then((response) => {
        console.log("Event Data:", response.data);
        setEventData(response.data.event);
        setLoadingEvent(false);
      })
      .catch((error) => {
        console.error("Error fetching event:", error);
        setLoadingEvent(false);
      });

    // Fetch reviews
    axios.get(`http://localhost:3001/reviews/${id}`)
      .then((response) => {
        setReviews(response.data);
        setLoadingReviews(false);
      })
      .catch((error) => {
        console.error("Error fetching reviews:", error);
        setLoadingReviews(false);
      });
  }, [id]);

  const handleStarClick = (index) => {
    setRating(index); // Set rating based on clicked star index
  };

  const addReview = () => {
    if (!newReview.trim() || rating === 0) return;

    // Send the new review with rating and review text
    axios.post("http://localhost:3001/reviews", { review_text: newReview, rating, eventId: id })
    .then((response) => {
        setReviews([...reviews, response.data]);
        setNewReview("");
        setRating(0);  // Reset rating to 0 after submitting
        alert("Your review was added successfully!");
      })
      .catch((error) => {
        console.error("Error adding review:", error);
        alert("There was an error adding your review. Please try again.");
      });
  };

  if (loadingEvent) {
    return <p className="text-center mt-5">Loading event details...</p>;
  }

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Event Details */}
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-header bg-primary text-white">Event Details</div>
            <div className="card-body">
              <h5 className="card-title">{eventData?.title || "Event Title"}</h5>
              <p className="card-text"><strong>Description:</strong> {eventData?.description || "No description available"}</p>
              <p className="card-text"><strong>Location:</strong> {eventData?.location || "Location not specified"}</p>
              <p className="card-text"><strong>Date:</strong> {eventData?.date || "Date not provided"}</p>
              <p className="card-text"><strong>Posted By:</strong> {eventData?.username || "Anonymous"}</p>
            </div>
            <div className="card-footer text-muted">Event ID: {id}</div>
          </div>
        </div>

        {/* Review Section */}
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
                <div className="star-rating" id="rating">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <span
                      key={index}
                      className={`star ${index <= rating ? "filled" : ""}`}
                      onClick={() => handleStarClick(index)}
                      style={{
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        color: index <= rating ? "gray" : "gold",
                      }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={addReview} className="btn btn-success mt-3">Add a Review</button>
            </div>
            <div className="card-footer text-muted">Updated recently</div>
          </div>

          <div className="ListOfReviews mt-3">
            {loadingReviews ? (
              <p className="text-center">Loading reviews...</p>
            ) : reviews.length > 0 ? (
              reviews.map((review, key) => (
                <div key={key} className="alert alert-secondary">
                  <p>{review.review_text || "No review text available"}</p>
                  {review.rating ? (
                    <p>
                      {Array.from({ length: review.rating }, (_, i) => (
                        <span key={i} style={{ color: "gold", fontSize: "1.5rem" }}>⭐</span>
                      ))}
                    </p>
                  ) : (
                    <p>No rating provided</p>
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
