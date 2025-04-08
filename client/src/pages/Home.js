import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import { AuthContext } from "../helpers/AuthContext";
import { format } from "date-fns";

export default function Home() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [visibleUpcomingEvents, setVisibleUpcomingEvents] = useState(8);
  const [visiblePastEvents, setVisiblePastEvents] = useState(8);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();

  // Color palette
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
  
  // Footer styles defined at the top to avoid ESLint warnings
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

  useEffect(() => {
    if (!authState.status) {
      navigate("/login");
    } else {
      axios
        .get("ai-powered-event-production.up.railway.app/events")
        .then((response) => {
          setListOfEvents(response.data);
          setLoading(false);
        })
        .catch((error) => {
          setError("There was an error loading events. Please try again later.");
          setLoading(false);
        });
    }
  }, [authState, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Extract unique categories from events
  const categories = [...new Set(listOfEvents
    .map(event => event.category)
    .filter(category => category && category.trim() !== "")
  )].sort();

  // Function to correct the image path
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If the path already starts with http, return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If the path begins with "/uploads/events/", ensure it's properly formed
    if (imagePath.startsWith('/uploads/events/')) {
      return `ai-powered-event-production.up.railway.app${imagePath}`;
    }
    
    // For any other case, just append the path to the base URL
    return `ai-powered-event-production.up.railway.app/${imagePath}`;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center" style={{ paddingTop: "100px" }}>
        <div className="spinner-border" role="status" style={{ color: colors.navy }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid" style={{ paddingTop: "100px" }}>
        <div className="alert alert-danger" role="alert">
          {error}{" "}
          <button 
            className="btn btn-sm" 
            onClick={() => setLoading(true)}
            style={{ backgroundColor: colors.navy, color: colors.white }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const today = new Date();
  const upcomingEvents = listOfEvents
    .filter((event) => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastEvents = listOfEvents
    .filter((event) => new Date(event.date) < today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filter events based on search criteria and category
  const filterEvents = (events) => {
    return events.filter((event) => {
      // Apply search filter
      let matchesSearch = true;
      if (searchQuery) {
        if (searchType === "title") {
          matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        } else if (searchType === "location") {
          matchesSearch = event.location.toLowerCase().includes(searchQuery.toLowerCase());
        }
      }
      
      // Apply category filter
      const matchesCategory = !selectedCategory || event.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  const filteredUpcomingEvents = filterEvents(upcomingEvents);
  const filteredPastEvents = filterEvents(pastEvents);

  const loadMoreUpcoming = () => {
    setVisibleUpcomingEvents((prev) => prev + 8);
  };

  const loadMorePast = () => {
    setVisiblePastEvents((prev) => prev + 8);
  };

  // Create event cards grid with new design
  const createEventGrid = (events, visibleCount) => {
    const visibleEvents = events.slice(0, visibleCount);

    // Display a placeholder message if no events found
    if (visibleEvents.length === 0) {
      return (
        <div className="col-12 text-center py-4">
          <p className="fs-5 text-muted">No events found matching your search criteria.</p>
          {(searchQuery || selectedCategory) && (
            <button
              className="btn btn-outline-secondary mt-2"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
              }}
              style={{ color: colors.navy, borderColor: colors.navy }}
            >
              <i className="bi bi-x-circle me-1"></i> Clear Filters
            </button>
          )}
        </div>
      );
    }

    // Return the actual events with NEW CARD DESIGN
    return visibleEvents.map((event) => (
      <div className="col-md-3 mb-4" key={event.id}>
        <div
          className="card h-100 shadow-sm event-card"
          onClick={() => navigate(`/event/${event.id}`)}
          style={{ 
            cursor: "pointer",
            borderRadius: "12px",
            overflow: "hidden",
            border: "none",
            height: "350px", // Fixed height to prevent shaking
            transition: "transform 0.3s ease, box-shadow 0.3s ease"
          }}
          onMouseEnter={() => setHoveredEventId(event.id)}
          onMouseLeave={() => setHoveredEventId(null)}
        >
          {/* Event Image with Hover Effect */}
          <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
            {event.image ? (
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
            
            {/* Overlay that appears on hover */}
            <div 
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(26, 42, 86, 0.85)",
                color: "white",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "15px",
                transition: "opacity 0.3s ease",
                opacity: hoveredEventId === event.id ? 1 : 0,
                textAlign: "center",
                pointerEvents: hoveredEventId === event.id ? "auto" : "none"
              }}
            >
              <h5>{event.title}</h5>
              <p className="mb-1"><i className="bi bi-calendar-event-fill me-2"></i>{format(new Date(event.date), "MMM dd, yyyy")}</p>
              <p className="mb-1"><i className="bi bi-clock-fill me-2"></i>{event.time ? format(new Date(`2000-01-01T${event.time}`), "h:mm a") : "N/A"}</p>
              <p className="mb-1"><i className="bi bi-geo-alt-fill me-2"></i>{event.location}</p>
              {event.username && (
                <p className="mb-1"><i className="bi bi-person-fill me-2"></i>By: {event.username}</p>
              )}
              <button 
                className="btn btn-sm mt-2" 
                style={{ backgroundColor: colors.pink, color: colors.white }}
              >
                View Details
              </button>
            </div>
          </div>
          
          {/* Category Badge */}
          <div className="position-absolute" style={{ top: "10px", right: "10px", zIndex: 2 }}>
            <span className="badge" style={{ backgroundColor: colors.pink, color: colors.white }}>
              {event.category || "Uncategorized"}
            </span>
          </div>
          
          {/* Card body - hidden on hover */}
          <div 
            className="card-body" 
            style={{ 
              display: hoveredEventId === event.id ? 'none' : 'block',
              backgroundColor: colors.white
            }}
          >
            <h5 className="card-title" style={{ color: colors.navy, fontWeight: "600" }}>{event.title}</h5>
            <p className="card-text" style={{ color: colors.darkGray }}>
              <i className="bi bi-calendar-event-fill me-2" style={{ color: colors.pink }}></i>
              {format(new Date(event.date), "MMM dd, yyyy")}
            </p>
            <p className="card-text" style={{ color: colors.darkGray }}>
              <i className="bi bi-geo-alt-fill me-2" style={{ color: colors.pink }}></i>
              {event.location}
            </p>
          </div>
        </div>
      </div>
    ));
  };

  // Footer styles moved to the top of the component

  return (
    <>
      <div className="container-fluid" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div className="container">
          {/* Search and Filter Bar */}
          <div className="row mb-4">
            <div className="col-lg-10 col-md-12 mx-auto">
              <div className="card shadow-sm" style={{ borderRadius: "12px", border: "none" }}>
                <div className="card-body">
                  <div className="row">
                    {/* Search Input */}
                    <div className="col-md-6 mb-2 mb-md-0">
                      <div className="input-group">
                        <span className="input-group-text border-0" style={{ backgroundColor: colors.white }}>
                          <i className="bi bi-search" style={{ color: colors.navy }}></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-0"
                          placeholder="Search events..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ boxShadow: "none" }}
                        />
                      </div>
                    </div>
                    
                    {/* Search Type Selector */}
                    <div className="col-md-3 mb-2 mb-md-0">
                      <select
                        className="form-select border-0"
                        style={{
                          boxShadow: "none",
                          backgroundColor: colors.white,
                          color: colors.navy,
                        }}
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                      >
                        <option value="title">By Title</option>
                        <option value="location">By Location</option>
                      </select>
                    </div>
                    
                    {/* Category Filter */}
                    <div className="col-md-3">
                      <select 
                        className="form-select border-0"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ boxShadow: "none" }}
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Results Indicator */}
          {(searchQuery || selectedCategory) && (
            <div className="row mb-3">
              <div className="col-12 text-center">
                <span
                  className="badge p-2"
                  style={{ backgroundColor: colors.white, color: colors.navy, border: `1px solid ${colors.navy}` }}
                >
                  Found {filteredUpcomingEvents.length + filteredPastEvents.length} events
                  {selectedCategory ? ` in "${selectedCategory}" category` : ""}
                  {searchQuery ? ` ${searchType === "title" ? "with title" : "at location"} containing "${searchQuery}"` : ""}
                </span>
              </div>
            </div>
          )}

          {/* Upcoming Events Section */}
          <div className="row">
            <div className="col-12 text-center mb-4">
              <h2 style={{ color: colors.navy, fontWeight: "700" }}>
                <span style={{ color: colors.pink }}>Upcoming</span> Events
              </h2>
            </div>
          </div>

          {/* Upcoming Events Grid */}
          <div className="row">
            {createEventGrid(filteredUpcomingEvents, visibleUpcomingEvents)}
          </div>

          {/* Load More Button for Upcoming Events */}
          {visibleUpcomingEvents < filteredUpcomingEvents.length && (
            <div className="row">
              <div className="col-12 text-center mb-5 mt-3">
                <button
                  className="btn px-4 py-2"
                  onClick={loadMoreUpcoming}
                  style={{
                    backgroundColor: colors.navy,
                    color: colors.white,
                    borderRadius: "12px",
                    fontWeight: "600"
                  }}
                >
                  Load More <i className="bi bi-arrow-down-circle ms-1"></i>
                </button>
              </div>
            </div>
          )}

          {/* Past Events Section */}
          <div className="row mt-5">
            <div className="col-12 text-center mb-4">
              <h2 style={{ color: colors.navy, fontWeight: "700" }}>
                Past Events
              </h2>
            </div>
          </div>

          {/* Past Events Grid */}
          <div className="row">
            {createEventGrid(filteredPastEvents, visiblePastEvents)}
          </div>

          {/* Load More Button for Past Events */}
          {visiblePastEvents < filteredPastEvents.length && (
            <div className="row">
              <div className="col-12 text-center mb-5 mt-3">
                <button
                  className="btn px-4 py-2"
                  onClick={loadMorePast}
                  style={{
                    backgroundColor: colors.navy,
                    color: colors.white,
                    borderRadius: "12px",
                    fontWeight: "600"
                  }}
                >
                  Load More <i className="bi bi-arrow-down-circle ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="btn shadow"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "20px",
            backgroundColor: colors.navy,
            color: colors.white,
            border: "none",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            zIndex: 1000
          }}
        >
          <i className="bi bi-arrow-up"></i>
        </button>
      )}

      {/* CSS for hover effects */}
      <style jsx>{`
        .event-card:hover .card-img-top {
          transform: scale(1.05);
        }
        
        .event-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>

      {/* Footer with accessibility-compliant links */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <i className="bi bi-heart-fill" style={footerIconStyle}></i> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <button 
              onClick={() => navigate("/terms")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Terms
            </button> •
            <button 
              onClick={() => navigate("/privacy")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", margin: "0 0.5rem", padding: 0}}
            >
              Privacy
            </button> •
            <button 
              onClick={() => navigate("/support")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
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