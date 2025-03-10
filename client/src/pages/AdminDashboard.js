"use client"

// Update the AdminDashboard.js file to display notifications
import { useEffect, useState, useContext, useMemo, useCallback } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.min.css"
import { AuthContext } from "../helpers/AuthContext"
import { format } from "date-fns"

export default function AdminDashboard() {
  const [listOfEvents, setListOfEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { authState } = useContext(AuthContext)
  const navigate = useNavigate()


  useEffect(() => {
    if (!authState.status || !authState.isAdmin) {
      navigate("/login")
    } else {
      axios
        .get("http://localhost:3001/events")
        .then((response) => {
          setListOfEvents(response.data)
          setLoading(false)
        })
        .catch((error) => {
          setError("There was an error loading events. Please try again later.")
          setLoading(false)
        })
    }
  }, [authState, navigate])

  const filterEvents = useCallback((events, query) => {
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.location.toLowerCase().includes(query.toLowerCase()),
    )
  }, [])

  const filteredEvents = useMemo(
    () => filterEvents(listOfEvents, searchQuery),
    [listOfEvents, searchQuery, filterEvents],
  )

  if (loading)
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="alert alert-danger" role="alert">
        {error}{" "}
        <button className="btn btn-warning btn-sm" onClick={() => setLoading(true)}>
          Retry
        </button>
      </div>
    )

  const today = new Date()
  const upcomingEvents = listOfEvents.filter((event) => new Date(event.date) >= today)
  const pastEvents = listOfEvents.filter((event) => new Date(event.date) < today)

  return (
    <div className="container" style={{ paddingTop: "70px" }}>

      {/* Statistics Section */}
      <div className="row text-center mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white p-3">
            <h5>Total Events</h5>
            <h3>{listOfEvents.length}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white p-3">
            <h5>Upcoming Events</h5>
            <h3>{upcomingEvents.length}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-danger text-white p-3">
            <h5>Past Events</h5>
            <h3>{pastEvents.length}</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="row mb-4">
        <div className="col-md-10">
          <input
            type="text"
            className="form-control"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="col-md-2">
        <button 
  className="btn w-100 text-white" 
  style={{ backgroundColor: "#FF6B6B" }} 
  onClick={() => setSearchQuery(searchQuery.trim())}
>
  Search
</button>

        </div>
      </div>

      {/* Events List */}
      <div className="row">
        {filteredEvents.length === 0 ? (
          <p>No events found.</p>
        ) : (
          filteredEvents.map((event) => (
            <div className="col-md-4 mb-4" key={event.id}>
              <div
                className="card event-card"
                onClick={() => navigate(`/response/${event.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="card-header text-white" style={{ backgroundColor: "#04305c" }}>
  {event.title}
</div>
                <div className="card-body">
                  <p className="card-text text-center">
                    <i className="bi bi-geo-alt-fill text-success"></i> {event.location}
                  </p>
                  <p className="card-text text-center">
                    <i className="bi bi-calendar-event-fill text-success"></i> {format(new Date(event.date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

