import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tooltip } from "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import { FaHeart } from "react-icons/fa";
import { AuthContext } from "../helpers/AuthContext";
import API from "../services/api";

export default function ImprovedCalendarView() {
  const [listOfEvents, setListOfEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateSelected, setDateSelected] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar"); // calendar or list
  const [currentMonthEvents, setCurrentMonthEvents] = useState([]);
  const [hoverEvent, setHoverEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const [calendarAddSuccess, setCalendarAddSuccess] = useState(false);
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
    eventBackground: "#FFF3E0", // Light orange background like in the screenshot
  };
  
  // Footer styles
  const footerStyle = {
    backgroundColor: colors.navy,
    color: colors.white,
    padding: "1.5rem",
    textAlign: "center",
    width: "100%",
    boxShadow: "0 -5px 10px rgba(0,0,0,0.05)",
    position: "relative",
    marginTop: "50px",
    bottom: 0,
    left: 0,
    right: 0
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
      API
        .get("https://ai-powered-event-production.up.railway.app/events")
        .then((response) => {
          setListOfEvents(response.data);
          setLoading(false);
          
          // Set initial current month events
          filterCurrentMonthEvents(response.data, dateSelected);
        })
        .catch((error) => {
          setError("There was an error loading events. Please try again later.");
          setLoading(false);
        });
    }
  }, [authState, navigate, dateSelected]);

  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltip) => new Tooltip(tooltip));
  }, [listOfEvents]);

  // Filter events for current month view
  const filterCurrentMonthEvents = (events, date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
    
    setCurrentMonthEvents(filteredEvents);
  };

  // Handle month change in calendar
  const changeMonth = (increment) => {
    const newDate = new Date(dateSelected);
    newDate.setMonth(newDate.getMonth() + increment);
    setDateSelected(newDate);
    filterCurrentMonthEvents(listOfEvents, newDate);
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh", paddingTop: "70px" }}>
      <div className="spinner-border" role="status" style={{ color: colors.pink }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger mx-auto mt-5" style={{ maxWidth: "600px" }}>
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      {error}
    </div>
  );

  // Get upcoming events for list view
  const upcomingEvents = [...listOfEvents]
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // Function to group events by date for the month view
  const groupEventsByDate = () => {
    const grouped = {};
    
    currentMonthEvents.forEach(event => {
      const date = new Date(event.date);
      const day = date.getDate();
      
      if (!grouped[day]) {
        grouped[day] = [];
      }
      
      grouped[day].push(event);
    });
    
    return grouped;
  };

  const eventsByDay = groupEventsByDate();
  
  // Get days in current month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getCurrentMonthDays = () => {
    const currentDate = new Date(dateSelected);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    
    const days = [];
    
    // Fill in days from previous month
    const prevMonthDays = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday as first day
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    for (let i = 0; i < prevMonthDays; i++) {
      days.push({
        date: new Date(prevMonthYear, prevMonth, daysInPrevMonth - prevMonthDays + i + 1),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }
    
    // Next month days to fill 6 rows (42 cells)
    const remainingCells = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(nextMonthYear, nextMonth, day),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Function to add event to user's calendar
  const addToCalendar = (event) => {
    // Format event details for calendar
    const eventTitle = encodeURIComponent(event.title);
    const eventStart = encodeURIComponent(new Date(event.date).toISOString());
    const eventEnd = encodeURIComponent(new Date(new Date(event.date).getTime() + 2*60*60*1000).toISOString()); // Default 2 hours
    const eventLocation = encodeURIComponent(event.location || '');
    const eventDetails = encodeURIComponent(event.description || '');
    
    // Create calendar URLs for different providers
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${eventStart.replace(/[-:]/g, '').replace(/\.\d+/g, '')}/${eventEnd.replace(/[-:]/g, '').replace(/\.\d+/g, '')}&details=${eventDetails}&location=${eventLocation}&sf=true&output=xml`;
    
    const yahooUrl = `https://calendar.yahoo.com/?v=60&title=${eventTitle}&st=${eventStart}&et=${eventEnd}&desc=${eventDetails}&in_loc=${eventLocation}`;
    
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${eventTitle}&startdt=${eventStart}&enddt=${eventEnd}&body=${eventDetails}&location=${eventLocation}`;
    
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DTSTART:${new Date(event.date).toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '')}`,
      `DTEND:${new Date(new Date(event.date).getTime() + 2*60*60*1000).toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '')}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\\n');
    
    // Create modal to let user choose calendar type
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1060';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '20px';
    modalContent.style.maxWidth = '400px';
    modalContent.style.width = '90%';
    modalContent.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    modalContent.innerHTML = `
      <h4 style="color: ${colors.navy}; margin-bottom: 20px;">Add to Calendar</h4>
      <p style="margin-bottom: 20px; color: ${colors.darkGray};">Choose your calendar provider:</p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <a href="${googleUrl}" target="_blank" style="text-decoration: none; color: white; background-color: ${colors.navy}; padding: 10px; border-radius: 4px; text-align: center;">
          <i class="bi bi-google me-2"></i>Google Calendar
        </a>
        <a href="${outlookUrl}" target="_blank" style="text-decoration: none; color: white; background-color: ${colors.navy}; padding: 10px; border-radius: 4px; text-align: center;">
          <i class="bi bi-microsoft me-2"></i>Outlook
        </a>
        <a href="${yahooUrl}" target="_blank" style="text-decoration: none; color: white; background-color: ${colors.navy}; padding: 10px; border-radius: 4px; text-align: center;">
          <i class="bi bi-calendar me-2"></i>Yahoo Calendar
        </a>
        <a href="data:text/calendar;charset=utf8,${encodeURIComponent(icalContent)}" download="${event.title.replace(/\s+/g, '_')}.ics" style="text-decoration: none; color: white; background-color: ${colors.pink}; padding: 10px; border-radius: 4px; text-align: center;">
          <i class="bi bi-file-earmark-arrow-down me-2"></i>Download ICS File
        </a>
      </div>
      <div style="text-align: right; margin-top: 20px;">
        <button id="close-modal" style="background-color: #f0f0f0; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    document.getElementById('close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
      // Show success message
      setCalendarAddSuccess(true);
      setTimeout(() => setCalendarAddSuccess(false), 3000);
    });
    
    // Log event for analytics (you could connect this to your backend)
    console.log(`User requested to add event to calendar: ${event.id} - ${event.title}`);
    
    // You could also track this event with an API call
    /*
    API.post('https://ai-powered-event-production.up.railway.app/events/calendar-add', {
      eventId: event.id,
      userId: authState.id
    }).catch(error => console.error('Error logging calendar add:', error));
    */
  };

  // Function to correct the image path
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) return imagePath;
    
    if (imagePath.startsWith('/uploads/events/')) {
      return `http://localhost:3001${imagePath}`;
    }
    
    return `http://localhost:3001/${imagePath}`;
  };

  // Simplified event display for the calendar cell
  const EventLabel = ({ event }) => {
    return (
      <div 
        className="event-label mb-1"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/event/${event.id}`);
        }}
        onMouseEnter={(e) => {
          setHoverEvent(event);
          setHoverPosition({ 
            top: e.clientY, 
            left: e.clientX + 20
          });
        }}
        onMouseLeave={() => setHoverEvent(null)}
        style={{
          backgroundColor: colors.eventBackground,
          borderLeft: `3px solid ${colors.pink}`,
          padding: "4px 6px",
          borderRadius: "3px",
          cursor: "pointer",
          fontSize: "0.8rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: colors.navy,
          fontWeight: "500"
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ color: colors.pink, marginRight: "5px", fontSize: "0.75rem" }}>
            {new Date(event.date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {event.title}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {calendarAddSuccess && (
          <div 
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: colors.successGreen,
              color: "white",
              padding: "10px 15px",
              borderRadius: "4px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              zIndex: 1050,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <i className="bi bi-check-circle-fill"></i>
            Event added to calendar successfully!
          </div>
        )}
        <div className="container" style={{ paddingTop: "40px", paddingBottom: "200px", flex: 1 }}>
          <div className="row mb-4">
            <div className="col-md-6">
              <h2 className="text-primary">
                <i className="bi bi-calendar-event me-2" style={{ color: colors.pink }}></i>
                <span style={{ color: colors.pink }}>Events </span>
                <span style={{ color: colors.navy }}>Calendar</span>
              </h2>
            </div>
            <div className="col-md-6 text-end">
              <div className="btn-group me-2">
                <button
                  className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode("calendar")}
                  style={{ 
                    backgroundColor: viewMode === 'calendar' ? colors.navy : 'white', 
                    borderColor: colors.navy,
                    color: viewMode === 'calendar' ? 'white' : colors.navy
                  }}
                >
                  <i className="bi bi-calendar3 me-1" style={{ color: viewMode === 'calendar' ? colors.pink : colors.navy }}></i> Calendar
                </button>

                <button
                  className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode("list")}
                  style={{ 
                    backgroundColor: viewMode === 'list' ? colors.navy : 'white', 
                    borderColor: colors.navy,
                    color: viewMode === 'list' ? 'white' : colors.navy
                  }}
                >
                  <i className="bi bi-list-ul me-1" style={{ color: viewMode === 'list' ? colors.pink : colors.navy }}></i> List
                </button>
              </div>
            </div>
          </div>

          {viewMode === "calendar" ? (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <i className="bi bi-calendar3-week me-2" style={{ color: colors.pink }}></i>
                        <span style={{ color: colors.navy }}>
                          {dateSelected.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                      </h5>
                      <div>
                        <button 
                          className="btn btn-sm"
                          onClick={() => changeMonth(-1)}
                          style={{ 
                            backgroundColor: "white", 
                            borderColor: colors.navy,
                            color: colors.navy,
                            marginRight: "0.5rem"
                          }}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                        <button 
                          className="btn btn-sm"
                          onClick={() => {
                            const newDate = new Date();
                            setDateSelected(newDate);
                            filterCurrentMonthEvents(listOfEvents, newDate);
                          }}
                          style={{ 
                            backgroundColor: colors.navy, 
                            color: "white",
                            marginRight: "0.5rem"
                          }}
                        >
                          Today
                        </button>
                        <button 
                          className="btn btn-sm"
                          onClick={() => changeMonth(1)}
                          style={{ 
                            backgroundColor: "white", 
                            borderColor: colors.navy,
                            color: colors.navy
                          }}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    {/* Calendar grid layout */}
                    <div className="table-responsive">
                      <table className="table table-bordered mb-0" style={{ tableLayout: 'fixed' }}>
                        <thead>
                          <tr style={{ backgroundColor: colors.navy, color: "white" }}>
                            <th className="text-center" style={{ width: "14.28%" }}>Mon</th>
                            <th className="text-center" style={{ width: "14.28%" }}>Tue</th>
                            <th className="text-center" style={{ width: "14.28%" }}>Wed</th>
                            <th className="text-center" style={{ width: "14.28%" }}>Thu</th>
                            <th className="text-center" style={{ width: "14.28%" }}>Fri</th>
                            <th className="text-center" style={{ width: "14.28%" }}>Sat</th>
                            <th className="text-center" style={{ width: "14.28%" }}>Sun</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Generate calendar rows */}
                          {Array.from({ length: 6 }, (_, weekIndex) => {
                            const days = getCurrentMonthDays().slice(weekIndex * 7, (weekIndex + 1) * 7);
                            
                            return (
                              <tr key={`week-${weekIndex}`} style={{ height: "auto", minHeight: "120px" }}>
                                {days.map((dayInfo, dayIndex) => {
                                  const day = dayInfo.date.getDate();
                                  const isCurrentMonth = dayInfo.isCurrentMonth;
                                  const isToday = new Date().toDateString() === dayInfo.date.toDateString();
                                  const dayEvents = isCurrentMonth 
                                    ? (eventsByDay[day] || []) 
                                    : [];
                                  
                                  return (
                                    <td 
                                      key={`day-${dayIndex}`} 
                                      className={`position-relative ${isCurrentMonth ? '' : 'text-muted'}`}
                                      style={{ 
                                        backgroundColor: isToday ? `rgba(255, 107, 107, 0.1)` : 
                                                      !isCurrentMonth ? `rgba(0, 0, 0, 0.03)` : 
                                                      'white',
                                        padding: "0.25rem",
                                        verticalAlign: "top",
                                        height: dayEvents.length > 0 ? "auto" : "80px"
                                      }}
                                      onClick={() => setDateSelected(dayInfo.date)}
                                    >
                                      <div 
                                        style={{ 
                                          color: isCurrentMonth ? (isToday ? colors.pink : colors.navy) : '#aaa',
                                          fontWeight: isToday ? 'bold' : 'normal',
                                          fontSize: '1.1rem',
                                          padding: '0.25rem',
                                          textAlign: 'right',
                                          marginBottom: '0.25rem'
                                        }}
                                      >
                                        {day}
                                      </div>
                                      
                                      {/* All events without scrolling */}
                                      <div style={{ 
                                        display: "flex",
                                        flexDirection: "column",
                                        height: "auto"
                                      }}>
                                        {isCurrentMonth && dayEvents.map((event) => (
                                          <EventLabel key={`event-${event.id}`} event={event} />
                                        ))}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // List View
            <div className="row">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <i className="bi bi-calendar-range me-2" style={{ color: colors.pink }}></i>
                      <span style={{ color: colors.navy }}>Upcoming Events</span>
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr style={{ color: colors.navy }}>
                            <th scope="col">Date</th>
                            <th scope="col">Event</th>
                            <th scope="col">Location</th>
                            <th scope="col">Category</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event) => (
                              <tr key={event.id} style={{ cursor: "pointer" }}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="text-center me-2" style={{ lineHeight: "1" }}>
                                      <div className="fw-bold" style={{ fontSize: "1.2rem", color: colors.pink }}>
                                        {new Date(event.date).getDate()}
                                      </div>
                                      <div className="small text-muted text-uppercase">
                                        {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="fw-bold" style={{ color: colors.navy }}>{event.title}</div>
                                  <div className="small text-muted">
                                    {new Date(event.date).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                                <td>
                                  <i className="bi bi-geo-alt-fill me-1" style={{ color: colors.pink }}></i>
                                  {event.location}
                                </td>
                                <td>
                                  <span className="badge bg-light" style={{ color: colors.navy }}>
                                    {event.category || "General"}
                                  </span>
                                </td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className="btn"
                                      onClick={() => navigate(`/event/${event.id}`)}
                                      style={{ borderColor: colors.navy, color: colors.navy }}
                                    >
                                      <i className="bi bi-eye"></i>
                                    </button>
                                    <button 
                                      className="btn" 
                                      style={{ borderColor: colors.pink, color: colors.pink }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCalendar(event);
                                      }}
                                      title="Add to my calendar"
                                    >
                                      <i className="bi bi-calendar-plus"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center py-4 text-muted">
                                No upcoming events found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer style={footerStyle}>
          <div style={footerContentStyle}>
            <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
              <FaHeart style={footerIconStyle} /> EventHub Community
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
        
        {/* Event details popup on hover */}
        {hoverEvent && (
          <div 
            className="event-popup"
            style={{
              position: "fixed",
              top: `${hoverPosition.top}px`,
              left: `${hoverPosition.left}px`,
              backgroundColor: colors.white,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              borderRadius: "8px",
              padding: "12px",
              zIndex: 1050,
              width: "280px",
              pointerEvents: "none",
            }}
          >
            {hoverEvent.image && (
              <div 
                style={{
                  width: "100%",
                  height: "140px",
                  borderRadius: "6px",
                  marginBottom: "10px",
                  backgroundImage: `url(${getImageUrl(hoverEvent.image)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "#f0f0f0"
                }}
              />
            )}
            
            <h5 style={{ margin: "0 0 5px 0", color: colors.navy }}>{hoverEvent.title}</h5>
            
            <div style={{ fontSize: "0.85rem", marginBottom: "5px", color: colors.pink, fontWeight: "500" }}>
              <i className="bi bi-clock me-2"></i>
              {new Date(hoverEvent.date).toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            <div style={{ fontSize: "0.85rem", marginBottom: "5px", color: colors.darkGray }}>
              <i className="bi bi-geo-alt-fill me-2"></i>
              {hoverEvent.location}
            </div>
            
            {hoverEvent.category && (
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    backgroundColor: colors.lightGray,
                    color: colors.navy,
                    padding: "3px 8px",
                    borderRadius: "12px",
                    display: "inline-block"
                  }}
                >
                  {hoverEvent.category}
                </span>
              </div>
            )}
            
            {hoverEvent.description && (
              <div style={{ 
                fontSize: "0.8rem", 
                marginTop: "8px", 
                color: colors.darkGray,
                maxHeight: "60px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical"
              }}>
                {hoverEvent.description}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}