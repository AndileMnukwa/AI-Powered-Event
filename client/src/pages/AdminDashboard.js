"use client"

import { useEffect, useState, useContext, useMemo, useCallback } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.min.css"
import { AuthContext } from "../helpers/AuthContext"
import { format } from "date-fns"
import API from "../services/api"

export default function AdminDashboard() {
  const [listOfEvents, setListOfEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [hoveredEventId, setHoveredEventId] = useState(null)
  const { authState } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authState.status || !authState.isAdmin) {
      navigate("/login")
    } else {
      API
        .get("https://ai-powered-event-production.up.railway.app/events")
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

  // Get unique categories from events
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(listOfEvents.map(event => event.category).filter(Boolean))]
    return uniqueCategories.sort()
  }, [listOfEvents])

  const filterEvents = useCallback((events, query, category) => {
    return events.filter(
      (event) => {
        const matchesQuery = 
          event.title.toLowerCase().includes(query.toLowerCase()) ||
          event.location.toLowerCase().includes(query.toLowerCase()) ||
          (event.category && event.category.toLowerCase().includes(query.toLowerCase()));
        
        const matchesCategory = !category || event.category === category;
        
        return matchesQuery && matchesCategory;
      }
    )
  }, [])

  const filteredEvents = useMemo(
    () => filterEvents(listOfEvents, searchQuery, selectedCategory),
    [listOfEvents, searchQuery, selectedCategory, filterEvents],
  )

  // Function to correct the image path
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}{" "}
        <button className="btn btn-warning btn-sm" onClick={() => setLoading(true)}>
          Retry
        </button>
      </div>
    )
  }

  const today = new Date()
  const upcomingEvents = listOfEvents.filter((event) => new Date(event.date) >= today)
  const pastEvents = listOfEvents.filter((event) => new Date(event.date) < today)
  
  // Group events by category
  const eventsByCategory = listOfEvents.reduce((acc, event) => {
    const category = event.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(event);
    return acc;
  }, {});

  return (
    <div className="admin-dashboard">
     {/* Professional Header Section with Enhanced Design */}
<header className="admin-header bg-primary text-white py-4 mb-4 shadow-sm">
  <div className="container">
    <div className="row align-items-center">
      <div className="col-md-4">
        <h1 className="h2 mb-1">Event Management</h1>
        <p className="mb-0 text-white-50">
          Welcome, {authState.username || 'Administrator'}
        </p>
      </div>
      
      <div className="col-md-4 text-center">
        <div className="header-spotlight py-2 px-3 rounded-pill bg-white bg-opacity-10 mb-2">
          <i className="bi bi-calendar-check text-warning me-2"></i>
          <span className="fw-bold">{upcomingEvents.length} Upcoming Events</span>
        </div>
        <div className="d-flex justify-content-center">
          <button 
            className="btn btn-sm btn-light me-2 shadow-sm" 
            onClick={() => navigate('/create_event')}
          >
            <i className="bi bi-plus-circle me-1"></i> New Event
          </button>
          <button 
            className="btn btn-sm btn-warning shadow-sm"
            onClick={() => navigate('/AdminAIReviewsDashboard')}
          >
            <i className="bi bi-graph-up me-1"></i> Analytics
          </button>
        </div>
      </div>
      
      <div className="col-md-4 text-end">
        <div className="header-date-display bg-white bg-opacity-10 p-2 rounded text-end d-inline-block">
          <div className="small text-white-50">Today's Date</div>
          <div className="fw-bold">{format(new Date(), "MMMM dd, yyyy")}</div>
        </div>
      </div>
    </div>
  </div>
  
  {/* Decorative wave element */}
  <div className="header-wave position-absolute bottom-0 start-0 w-100 overflow-hidden" style={{ height: "15px" }}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ height: "100%", width: "100%" }}>
      <path 
        fill="#f4f6f9" 
        fillOpacity="1" 
        d="M0,32L48,37.3C96,43,192,53,288,64C384,75,480,85,576,80C672,75,768,53,864,48C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"
      ></path>
    </svg>
  </div>
  
  {/* Add custom styles */}
  <style jsx>{`
    .admin-header {
      background: linear-gradient(135deg, #04305c 0%, #0a5dc2 100%) !important;
      position: relative;
      overflow: hidden;
    }
    
    .header-spotlight {
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: pulse 2s infinite;
    }
    
    .header-date-display {
      border-left: 3px solid #FFD700;
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
    }
  `}</style>
</header>

      <div className="container" style={{ paddingTop: "20px" }}>
        {/* Statistics Section */}
        <div className="row text-center mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white p-3">
              <h5>Total Events</h5>
              <h3>{listOfEvents.length}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white p-3">
              <h5>Upcoming Events</h5>
              <h3>{upcomingEvents.length}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white p-3">
              <h5>Past Events</h5>
              <h3>{pastEvents.length}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white p-3">
              <h5>Categories</h5>
              <h3>{categories.length}</h3>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                className="btn text-white" 
                style={{ backgroundColor: "#FF6B6B" }} 
                onClick={() => setSearchQuery(searchQuery.trim())}
              >
                <i className="bi bi-search"></i> Search
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <select 
              className="form-select" 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
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
                  className="card h-100 shadow event-card"
                  onClick={() => navigate(`/response/${event.id}`)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                >
                  {/* Event Image with Hover Effect */}
                  <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
                    {event.image ? (
                      <>
                        <img 
                          src={getImageUrl(event.image)} 
                          className="card-img-top" 
                          alt={event.title}
                          style={{ 
                            height: "100%", 
                            width: "100%", 
                            objectFit: "cover",
                            transition: "transform 0.3s ease"
                          }}
                        />
                        {/* Overlay that appears on hover */}
                        {hoveredEventId === event.id && (
                          <div 
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(4, 48, 92, 0.85)",
                              color: "white",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              padding: "15px",
                              transition: "opacity 0.3s ease",
                              opacity: 1,
                              textAlign: "center"
                            }}
                          >
                            <h5>{event.title}</h5>
                            <p className="mb-1"><i className="bi bi-calendar-event-fill me-2"></i>{format(new Date(event.date), "MMM dd, yyyy")}</p>
                            <p className="mb-1"><i className="bi bi-clock-fill me-2"></i>{event.time ? format(new Date(`2000-01-01T${event.time}`), "h:mm a") : "N/A"}</p>
                            <p className="mb-1"><i className="bi bi-geo-alt-fill me-2"></i>{event.location}</p>
                            <button className="btn btn-sm btn-light mt-2">View Details</button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div 
                        className="d-flex justify-content-center align-items-center"
                        style={{ 
                          height: "100%", 
                          backgroundColor: "#f0f0f0",
                          color: "#aaa"
                        }}
                      >
                        <i className="bi bi-image" style={{ fontSize: "3rem" }}></i>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Badge */}
                  <div className="position-absolute" style={{ top: "10px", right: "10px", zIndex: 2 }}>
                    <span className="badge bg-light text-dark">
                      {event.category || "Uncategorized"}
                    </span>
                  </div>
                  
                  <div className="card-header text-white" style={{ backgroundColor: "#04305c" }}>
                    <h5 className="card-title mb-0">{event.title}</h5>
                  </div>
                  
                  <div className="card-body">
                    <p className="card-text">
                      <i className="bi bi-geo-alt-fill text-success me-2"></i> {event.location}
                    </p>
                    <p className="card-text">
                      <i className="bi bi-calendar-event-fill text-success me-2"></i> 
                      {format(new Date(event.date), "MMM dd, yyyy")}
                    </p>
                    <p className="card-text">
                      <i className="bi bi-clock-fill text-success me-2"></i> 
                      {event.time ? format(new Date(`2000-01-01T${event.time}`), "h:mm a") : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Category View Toggle */}
        <div className="row mt-5">
          <div className="col-12">
            <h3 className="mb-4">Events by Category</h3>
            <div className="accordion" id="categoryAccordion">
              {Object.keys(eventsByCategory).map((category, index) => (
                <div className="accordion-item" key={category}>
                  <h2 className="accordion-header" id={`heading${index}`}>
                    <button 
                      className="accordion-button collapsed" 
                      type="button" 
                      data-bs-toggle="collapse" 
                      data-bs-target={`#collapse${index}`} 
                      aria-expanded="false" 
                      aria-controls={`collapse${index}`}
                    >
                      {category} ({eventsByCategory[category].length})
                    </button>
                  </h2>
                  <div 
                    id={`collapse${index}`} 
                    className="accordion-collapse collapse" 
                    aria-labelledby={`heading${index}`} 
                    data-bs-parent="#categoryAccordion"
                  >
                    <div className="accordion-body">
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Image</th>
                              <th>Title</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Location</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventsByCategory[category].map(event => (
                              <tr 
                                key={event.id} 
                                onClick={() => navigate(`/response/${event.id}`)}
                                style={{ cursor: "pointer" }}
                              >
                                <td>
                                  {event.image ? (
                                    <img 
                                      src={getImageUrl(event.image)} 
                                      alt={event.title}
                                      style={{ 
                                        width: "50px", 
                                        height: "50px", 
                                        objectFit: "cover",
                                        borderRadius: "4px" 
                                      }}
                                    />
                                  ) : (
                                    <div 
                                      className="d-flex justify-content-center align-items-center"
                                      style={{ 
                                        width: "50px", 
                                        height: "50px", 
                                        backgroundColor: "#f0f0f0",
                                        borderRadius: "4px" 
                                      }}
                                    >
                                      <i className="bi bi-image"></i>
                                    </div>
                                  )}
                                </td>
                                <td>{event.title}</td>
                                <td>{format(new Date(event.date), "MMM dd, yyyy")}</td>
                                <td>{event.time ? format(new Date(`2000-01-01T${event.time}`), "h:mm a") : "N/A"}</td>
                                <td>{event.location}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style jsx>{`
          .event-card:hover .card-img-top {
            transform: scale(1.05);
          }
          
          .event-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .event-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2) !important;
          }

          .admin-header {
            background-color: #04305c !important;
          }
          
          .admin-dashboard {
            background-color: #f4f6f9;
          }
        `}</style>
      </div>
    </div>
  )
}