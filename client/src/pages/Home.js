import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3001/events")
      .then((response) => {
        setListOfEvents(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setError("There was an error loading events. Please try again later.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading events...</p>;
  }

  if (error) {
    return (
      <div>
        <p className="text-danger">{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {listOfEvents.length === 0 ? (
        <p>No events found.</p>
      ) : (
        listOfEvents.map((event) => (
          <div 
            key={event.id}  // Use event.id instead of index
            className="event" 
            onClick={() => navigate(`/event/${event.id}`)}
            style={{ cursor: "pointer", marginBottom: "15px" }}  // Add pointer cursor to show it's clickable
          >
            <div className="eventTitle">{event.title}</div>
            <div className="body">
              <p>{event.description}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Date:</strong> {event.date}</p>
            </div>
            <div className="footer">Posted by {event.username}</div>
          </div>
        ))
      )}
    </div>
  );
}
