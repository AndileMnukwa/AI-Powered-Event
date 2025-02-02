
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap styles

export default function Event() {
  const { id } = useParams();
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3001/events/byId/${id}`)
      .then((response) => {
        setEventData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching event:", error);
      });
  }, [id]);

  if (!eventData) {
    return <p className="text-center mt-5">Loading event details...</p>;
  }

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Left Side - Event Details */}
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-header bg-primary text-white">Event Details</div>
            <div className="card-body">
              <h5 className="card-title">{eventData.title}</h5>
              <p className="card-text"><strong>Description:</strong> {eventData.description}</p>
              <p className="card-text"><strong>Location:</strong> {eventData.location}</p>
              <p className="card-text"><strong>Date:</strong> {eventData.date}</p>
              <p className="card-text"><strong>Posted By:</strong> {eventData.username}</p>
            </div>
            <div className="card-footer text-muted">Event ID: {id}</div>
          </div>
        </div>

        {/* Right Side - Review Details */}
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-header bg-success text-white">Reviews</div>
            <div className="card-body">
              <p className="card-text">Review details will be displayed here.</p>
              <a href="#" className="btn btn-success">Add a Review</a>
            </div>
            <div className="card-footer text-muted">Updated recently</div>
          </div>
        </div>
      </div>
    </div>
  );
}
