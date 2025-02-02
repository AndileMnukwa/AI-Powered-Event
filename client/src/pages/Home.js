import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3001/events")
      .then((response) => {
        setListOfEvents(response.data);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });
  }, []);

  return (
    <div>
      {listOfEvents.map((event, index) => (
        <div key={index} className="event" onClick={() => navigate(`/event/${event.id}`)}>
          <div className="eventTitle">{event.title}</div>
          <div className="body">
            <p>{event.description}</p> {/* ✅ Fixed casing */}
            <p><strong>Location:</strong> {event.location}</p> {/* ✅ Fixed casing */}
            <p><strong>Date:</strong> {event.date}</p> {/* ✅ Fixed casing */}
          </div>
          <div className="footer">Posted by {event.username}</div> {/* ✅ Fixed casing */}
        </div>
      ))}
    </div>
  );
}
