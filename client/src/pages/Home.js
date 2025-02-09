import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Ensure the calendar styles are imported

export default function Home() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateSelected, setDateSelected] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3001/events")
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

  // Filter events based on search query (by title or location)
  const filteredEvents = listOfEvents.filter((event) => {
    const title = event.title ? event.title.toLowerCase() : "";
    const location = event.location ? event.location.toLowerCase() : "";
    const query = searchQuery.toLowerCase();

    return title.includes(query) || location.includes(query);
  });

  // Handle date selection in the calendar
  const handleDateChange = (date) => {
    setDateSelected(date);
  };

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        {/* Left: Search Bar + Calendar */}
        <div className="col-md-6 mb-4">
          {/* Search Bar */}
          <input
            type="text"
            className="form-control"
            placeholder="Search events by title or location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
  
          {/* Calendar */}
          <div className="mt-4">
            <Calendar
              onChange={handleDateChange}
              value={dateSelected}
              tileClassName={({ date, view }) => {
                // Highlight the dates that have events
                const eventDates = listOfEvents.map((event) => new Date(event.date).toDateString());
                if (eventDates.includes(date.toDateString())) {
                  return 'highlighted-date'; // Custom CSS class to highlight dates with events
                }
                return null;
              }}
            />
          </div>
        </div>
  
        {/* Middle: Events List */}
        <div className="col-md-6 mb-4">
          <h3 className="mb-4">Events</h3>
          {filteredEvents.length === 0 ? (
            <p>No events found.</p>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="event card mb-3"
                onClick={() => navigate(`/event/${event.id}`)}
                style={{ cursor: "pointer" }}  // Add pointer cursor to show it's clickable
              >
                <div className="card-body">
                  <h5 className="card-title">{event.title}</h5>
                  <p className="card-text">{event.location}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
