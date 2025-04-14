// src/pages/AIReviewsPage.js - Optimized version with single fetch for event list + stats
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Assuming axios is configured with base URL in services/api.js or globally
import 'bootstrap/dist/css/bootstrap.min.css';

// Define the colors (assuming these are defined elsewhere or imported)
const colors = {
  primary: "#FF5A8E", // Vibrant pink
  secondary: "#0D1B40", // Deep navy
  accent: "#41C9E2", // Bright turquoise accent
  dark: "#081029", // Very dark navy, almost black
  light: "#FFF5F8", // Very light pink (off-white with pink tint)
  text: "#0D1B40", // Navy for main text
  textLight: "#6C7A9C", // Muted navy for secondary text
  chart: ["#FF5A8E", "#0D1B40", "#41C9E2", "#FF9E6D", "#8676FF", "#44D7B6"]
};

// Simple error display component
const ErrorAlert = ({ message }) => (
  <div className="container py-3">
    <div className="alert alert-danger" role="alert">
      <h4 className="alert-heading">Error Loading Data</h4>
      <p>{message || 'An unexpected error occurred. Please try again later.'}</p>
    </div>
  </div>
);

// Loading spinner component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center my-4">
    <div className="spinner-border" role="status" style={{ color: colors.primary }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Event card component (No changes needed)
const EventCard = ({ event, selectedEvent, selectEvent }) => (
  <div
    className="p-3 border-bottom"
    onClick={() => selectEvent(event)}
    role="option"
    tabIndex={0}
    aria-selected={selectedEvent?.id === event.id}
    onKeyDown={(e) => e.key === 'Enter' && selectEvent(event)}
    style={{
      cursor: 'pointer',
      backgroundColor: selectedEvent?.id === event.id ? `rgba(255, 90, 142, 0.1)` : 'white',
      borderLeft: selectedEvent?.id === event.id ? `4px solid ${colors.primary}` : '4px solid transparent',
      transition: 'all 0.2s ease'
    }}
  >
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <h4 className="fs-6 mb-1" style={{ color: colors.secondary, fontWeight: '600' }}>
          {event.title}
        </h4>
        <div style={{ fontSize: '0.85rem', color: colors.textLight }}>
          {/* Ensure date is formatted correctly */}
          {event.date ? new Date(event.date).toLocaleDateString() : 'Date N/A'} • {event.category}
        </div>
      </div>
      <div
        className="px-2 py-1 rounded-pill"
        style={{
          backgroundColor: colors.light,
          color: colors.primary,
          fontSize: '0.9rem',
          fontWeight: '600'
        }}
      >
        {/* Use pre-calculated avgRating */}
        {event.avgRating ? event.avgRating.toFixed(1) : 'N/A'} ★
      </div>
    </div>

    <div className="d-flex align-items-center mt-2">
      <div
        className="me-2 flex-grow-1"
        style={{
          height: '6px',
          backgroundColor: '#e9ecef',
          borderRadius: '3px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            // Use pre-calculated sentimentScore
            width: `${event.sentimentScore || 0}%`,
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: '3px'
          }}
          aria-label={`${event.sentimentScore || 0}% positive sentiment`}
          role="progressbar"
          aria-valuenow={event.sentimentScore || 0}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <span style={{ fontSize: '0.8rem', color: colors.textLight }}>
         {/* Use pre-calculated sentimentScore */}
        {event.sentimentScore || 0}% Positive
      </span>
    </div>
  </div>
);

// Tab Content component (No changes needed)
const TabContent = ({ activeTab, selectedEvent }) => {
  if (!selectedEvent) return null;
  switch (activeTab) {
    case 'attendance':
      return <AttendanceChart selectedEvent={selectedEvent} />;
    case 'satisfaction':
      return <SatisfactionChart selectedEvent={selectedEvent} />;
    case 'ratings':
      return <RatingsChart selectedEvent={selectedEvent} />;
    case 'engagement':
      return <EngagementChart selectedEvent={selectedEvent} />;
    case 'reviews':
      // ReviewsList still needs to fetch reviews for the selected event
      return <ReviewsList selectedEvent={selectedEvent} />;
    case 'insights':
      return <AIInsights selectedEvent={selectedEvent} />;
    default:
      return <AttendanceChart selectedEvent={selectedEvent} />;
  }
};

// --- Mock/Sample Chart Components (Keep as is or implement API calls later) ---
// Attendance Chart component
const AttendanceChart = ({ selectedEvent }) => {
  // ... (keep existing mock data logic for now) ...
   const [attendanceData, setAttendanceData] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const fetchAttendanceData = async () => {
       try {
         // Sample data
         const data = [
           { day: 'Day 1', attendance: Math.floor(Math.random() * 1000) + 500 },
           { day: 'Day 2', attendance: Math.floor(Math.random() * 1000) + 500 },
           { day: 'Day 3', attendance: Math.floor(Math.random() * 1000) + 500 }
         ];
         setAttendanceData(data);
         setLoading(false);
       } catch (error) {
         console.error("Error fetching attendance data:", error);
         setLoading(false);
       }
     };
     if (selectedEvent && selectedEvent.id) {
       fetchAttendanceData();
     }
   }, [selectedEvent]);

   if (loading) return <LoadingSpinner />;
   if (attendanceData.length === 0) return <div className="text-center p-4">No attendance data available</div>;
   const maxAttendance = Math.max(...attendanceData.map(d => d.attendance));
   const sessionLabel = attendanceData[0].day.includes('Day') ? 'Day' : 'Session';

   return (
     <div className="tab-pane fade show active" id="attendance-tab">
       <h5 className="mb-3" style={{ color: colors.primary }}>Attendance by {sessionLabel}</h5>
       <div style={{ height: '300px' }}>
         <div className="p-5 text-center bg-light rounded">
           <div className="d-flex justify-content-around">
             {attendanceData.map((item, index) => ( <div key={index} style={{ height: `${(item.attendance / maxAttendance * 250)}px`, width: '40px', backgroundColor: colors.primary, borderRadius: '3px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', color: 'white', fontWeight: 'bold', paddingBottom: '5px', fontSize: '0.8rem' }} role="img" aria-label={`${item.day}: ${item.attendance} attendees`} > {item.attendance} </div> ))}
           </div>
           <div className="d-flex justify-content-around mt-2">
             {attendanceData.map((item, index) => ( <div key={index} style={{ width: '40px', textAlign: 'center', fontSize: '0.8rem' }}> {item.day} </div> ))}
           </div>
         </div>
       </div>
     </div>
   );
};

// Satisfaction Chart component
const SatisfactionChart = ({ selectedEvent }) => {
  // ... (keep existing mock data logic for now) ...
    const [satisfactionData, setSatisfactionData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchSatisfactionData = async () => {
        try {
          const data = [ { name: 'Very Satisfied', value: 65 }, { name: 'Satisfied', value: 25 }, { name: 'Neutral', value: 7 }, { name: 'Dissatisfied', value: 3 } ];
          setSatisfactionData(data); setLoading(false);
        } catch (error) { console.error("Error fetching satisfaction data:", error); setLoading(false); }
      };
      if (selectedEvent && selectedEvent.id) { fetchSatisfactionData(); }
    }, [selectedEvent]);

    if (loading) return <LoadingSpinner />;
    if (satisfactionData.length === 0) return <div className="text-center p-4">No satisfaction data available</div>;

    return (
      <div className="tab-pane fade show active" id="satisfaction-tab">
        <h5 className="mb-3" style={{ color: colors.primary }}>Satisfaction Distribution</h5>
        <div style={{ height: '300px' }}>
          <div className="text-center">
            <div className="d-inline-block position-relative" style={{ width: '250px', height: '250px' }}>
              <div style={{ width: '250px', height: '250px', borderRadius: '50%', background: `conic-gradient( ${colors.chart[0]} 0% ${satisfactionData[0].value}%, ${colors.chart[1]} ${satisfactionData[0].value}% ${satisfactionData[0].value + satisfactionData[1].value}%, ${colors.chart[2]} ${satisfactionData[0].value + satisfactionData[1].value}% ${satisfactionData[0].value + satisfactionData[1].value + satisfactionData[2].value}%, ${colors.chart[3]} ${satisfactionData[0].value + satisfactionData[1].value + satisfactionData[2].value}% 100% )` }} role="img" aria-label="Satisfaction distribution pie chart" ></div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: colors.secondary }} > Satisfaction </div>
            </div>
            <div className="mt-3"> <div className="d-flex justify-content-center flex-wrap"> {satisfactionData.map((item, index) => ( <div key={index} className="mx-2 mb-2 d-flex align-items-center"> <div style={{ width: '15px', height: '15px', backgroundColor: colors.chart[index], marginRight: '5px', borderRadius: '3px' }} ></div> <span style={{ fontSize: '0.9rem' }}>{item.name}: {item.value}%</span> </div> ))} </div> </div>
          </div>
        </div>
      </div>
    );
};

// Ratings Chart component
const RatingsChart = ({ selectedEvent }) => {
  // ... (keep existing mock data logic for now) ...
    const [ratingBreakdown, setRatingBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchRatingData = async () => {
        try {
          const data = [ { category: 'Content', rating: 4.8 }, { category: 'Speakers', rating: 4.7 }, { category: 'Venue', rating: 4.6 }, { category: 'Organization', rating: 4.5 }, { category: 'Value', rating: 4.7 } ];
          setRatingBreakdown(data); setLoading(false);
        } catch (error) { console.error("Error fetching rating data:", error); setLoading(false); }
      };
      if (selectedEvent && selectedEvent.id) { fetchRatingData(); }
    }, [selectedEvent]);

    if (loading) return <LoadingSpinner />;
    if (ratingBreakdown.length === 0) return <div className="text-center p-4">No rating breakdown available</div>;

    return (
      <div className="tab-pane fade show active" id="ratings-tab">
        <h5 className="mb-3" style={{ color: colors.primary }}>Rating by Category</h5>
        <div style={{ height: '300px' }}>
          <div className="p-3 bg-light rounded"> {ratingBreakdown.map((item, index) => ( <div key={index} className="mb-3"> <div className="d-flex justify-content-between mb-1"> <span style={{ fontWeight: '500' }}>{item.category}</span> <span>{item.rating.toFixed(1)}/5.0</span> </div> <div className="progress" style={{ height: '25px' }} > <div className="progress-bar" role="progressbar" style={{ width: `${(item.rating / 5) * 100}%`, backgroundColor: colors.secondary, borderRadius: '4px' }} aria-valuenow={item.rating} aria-valuemin="0" aria-valuemax="5" ></div> </div> </div> ))} </div>
        </div>
      </div>
    );
};

// Engagement Chart component
const EngagementChart = ({ selectedEvent }) => {
  // ... (keep existing mock data logic for now) ...
    const [engagementData, setEngagementData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchEngagementData = async () => {
        try {
          const data = [ { time: '9 AM', engagement: 70 }, { time: '10 AM', engagement: 82 }, { time: '11 AM', engagement: 93 }, { time: '12 PM', engagement: 65 }, { time: '1 PM', engagement: 75 }, { time: '2 PM', engagement: 85 }, { time: '3 PM', engagement: 90 }, { time: '4 PM', engagement: 88 }, { time: '5 PM', engagement: 72 } ];
          setEngagementData(data); setLoading(false);
        } catch (error) { console.error("Error fetching engagement data:", error); setLoading(false); }
      };
      if (selectedEvent && selectedEvent.id) { fetchEngagementData(); }
    }, [selectedEvent]);

    if (loading) return <LoadingSpinner />;
    if (engagementData.length === 0) return <div className="text-center p-4">No engagement data available</div>;

    return (
      <div className="tab-pane fade show active" id="engagement-tab">
        <h5 className="mb-3" style={{ color: colors.primary }}>Engagement Timeline</h5>
        <div style={{ height: '300px' }}>
          <div className="p-3 bg-light rounded">
            <div style={{ height: '200px', position: 'relative', padding: '20px 0' }} >
              {/* Y-axis */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: '10px', fontSize: '0.8rem', color: colors.textLight }} > <div>100%</div> <div>75%</div> <div>50%</div> <div>25%</div> <div>0%</div> </div>
              {/* Chart Area */}
              <div style={{ marginLeft: '40px', height: '100%', position: 'relative', borderLeft: '1px solid #ccc', borderBottom: '1px solid #ccc' }} >
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} role="img" aria-label="Engagement timeline chart" > <defs> <linearGradient id="engagementGradient" x1="0%" y1="0%" x2="0%" y2="100%"> <stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" /> <stop offset="100%" stopColor={colors.accent} stopOpacity="0.1" /> </linearGradient> </defs> <path d={`M 0,${200 - (engagementData[0].engagement / 100 * 200)} ${engagementData.map((item, i) => `L ${(i / (engagementData.length - 1)) * 100}%,${200 - (item.engagement / 100 * 200)}`).join(' ')}`} stroke={colors.accent} strokeWidth="3" fill="none" /> <path d={`M 0,${200 - (engagementData[0].engagement / 100 * 200)} ${engagementData.map((item, i) => `L ${(i / (engagementData.length - 1)) * 100}%,${200 - (item.engagement / 100 * 200)}`).join(' ')} L 100%,200 L 0,200 Z`} fill="url(#engagementGradient)" /> </svg>
                {engagementData.map((item, i) => ( <div key={i} style={{ position: 'absolute', left: `${(i / (engagementData.length - 1)) * 100}%`, bottom: `${(item.engagement / 100) * 100}%`, width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.accent, border: '2px solid white', transform: 'translate(-50%, 50%)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 2 }} title={`${item.time}: ${item.engagement}%`} ></div> ))}
              </div>
              <div style={{ display: 'flex', marginLeft: '40px', justifyContent: 'space-between', fontSize: '0.8rem', color: colors.textLight }} > {engagementData.map((item, i) => ( i % 2 === 0 && <div key={i} style={{ position: 'relative', textAlign: 'center', width: `${100 / Math.ceil(engagementData.length / 2)}%` }} > {item.time} </div> ))} </div>
            </div>
          </div>
        </div>
      </div>
    );
};

// Reviews List component - Still needs to fetch reviews for the selected event
const ReviewsList = ({ selectedEvent }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
       setLoading(true); // Start loading when fetching
       setError(null); // Clear previous errors
      try {
        // Fetch reviews for the specific selected event
        const response = await axios.get(`/events/${selectedEvent.id}`);
        console.log(`Reviews response for event ${selectedEvent.id}:`, response.data);

        // Extract reviews array (handle different possible response structures)
        let reviewsArray = [];
        if (response.data && response.data.reviews) {
            reviewsArray = response.data.reviews;
        } else if (response.data && response.data.event && response.data.event.Reviews) {
            reviewsArray = response.data.event.Reviews;
        } else if (response.data && Array.isArray(response.data)) {
           // If the endpoint `/events/:eventId` returns just the reviews array directly
           reviewsArray = response.data;
        }

        // Ensure we have an array
        if (!Array.isArray(reviewsArray)) {
          console.error("Reviews data is not an array:", reviewsArray);
          reviewsArray = [];
        }

        setReviews(reviewsArray);
      } catch (err) {
        console.error(`Error fetching reviews for event ${selectedEvent.id}:`, err);
        setError(`Failed to load reviews for ${selectedEvent.title}.`);
      } finally {
         setLoading(false);
      }
    };

    if (selectedEvent && selectedEvent.id) {
      fetchReviews();
    } else {
        setReviews([]); // Clear reviews if no event is selected
        setLoading(false);
    }
  }, [selectedEvent]); // Rerun when selectedEvent changes

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center p-4 text-danger">{error}</div>;
  if (!reviews || reviews.length === 0) return <div className="text-center p-4">No reviews available for this event</div>;

  return (
    <div className="tab-pane fade show active" id="reviews-tab">
      <h5 className="mb-3" style={{ color: colors.primary }}>Top Reviews</h5>
      <div className="bg-light p-3 rounded">
        {reviews.map((review) => (
          <div key={review.id} className="mb-3 p-3 bg-white rounded shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-bold">{review.username}</div>
              <div>
                <span style={{ color: colors.primary, fontWeight: '600' }}>{review.rating} ★</span>
                <span className="ms-2 text-muted" style={{ fontSize: '0.8rem' }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className="mb-0" style={{ fontSize: '0.9rem' }}>{review.review_text}</p>
            {review.admin_response && (
              <div className="mt-2 p-2 border-top">
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Admin Response:</div>
                <p className="mb-0" style={{ fontSize: '0.9rem' }}>{review.admin_response}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// AI Insights component (Keep as is or implement API calls later)
const AIInsights = ({ selectedEvent }) => {
  // ... (keep existing mock data logic for now) ...
   const [insights, setInsights] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const fetchInsights = async () => {
       try {
         if (selectedEvent && selectedEvent.category) {
           const typeBasedInsights = [ `Attendees showed highest engagement during sessions on ${selectedEvent.category}`, `${Math.floor(Math.random() * 20) + 80}% of attendees rated the networking opportunities as 'excellent' or 'very good'`, `Most frequently mentioned keywords in positive reviews: 'organization', 'content', 'speakers'`, `Suggestion for improvement: More interactive activities based on feedback analysis` ];
           setInsights(typeBasedInsights);
         } else { setInsights(["No insights available for this event."]); }
         setLoading(false);
       } catch (error) { console.error("Error fetching AI insights:", error); setLoading(false); }
     };
     if (selectedEvent) { fetchInsights(); }
   }, [selectedEvent]);

   return (
     <div className="tab-pane fade show active" id="insights-tab">
       <h5 className="mb-3" style={{ color: colors.primary }}>AI-Generated Insights</h5>
       <div className="bg-light p-3 rounded">
         <div className="p-3 bg-white rounded shadow-sm">
           <ul className="mb-0"> {insights.map((insight, index) => ( <li key={index} className="mb-2">{insight}</li> ))} </ul>
         </div>
       </div>
     </div>
   );
};

// Key Metrics component (Uses pre-calculated data)
const KeyMetrics = ({ selectedEvent }) => {
  if (!selectedEvent) return null;

  // Use pre-calculated totalAttendance if available, otherwise generate mock data
  const totalAttendance = selectedEvent.totalAttendance || Math.floor(Math.random() * 3000) + 1000;

  return (
    <div className="row g-3 mb-4">
      <div className="col-md-3 col-sm-6">
        <div className="p-3 rounded text-center h-100" style={{ backgroundColor: `rgba(255, 90, 142, 0.1)` }} >
          <div style={{ color: colors.primary, fontSize: '2rem', fontWeight: '700' }}> {selectedEvent.avgRating ? selectedEvent.avgRating.toFixed(1) : 'N/A'} </div>
          <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}> Overall Rating </div>
          <div style={{ color: colors.primary }} aria-hidden="true"> {"★".repeat(Math.round(selectedEvent.avgRating || 0))} </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="p-3 rounded text-center h-100" style={{ backgroundColor: `rgba(13, 27, 64, 0.1)` }} >
          {/* Use pre-calculated reviewCount */}
          <div style={{ color: colors.secondary, fontSize: '2rem', fontWeight: '700' }}> {selectedEvent.reviewCount || 0} </div>
          <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}> Total Reviews </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="p-3 rounded text-center h-100" style={{ backgroundColor: `rgba(65, 201, 226, 0.1)` }} >
           {/* Use pre-calculated sentimentScore */}
          <div style={{ color: colors.accent, fontSize: '2rem', fontWeight: '700' }}> {selectedEvent.sentimentScore || 0}% </div>
          <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}> Positive Sentiment </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="p-3 rounded text-center h-100" style={{ backgroundColor: 'rgba(255, 158, 109, 0.1)' }} >
          <div style={{ color: '#FF9E6D', fontSize: '2rem', fontWeight: '700' }}> {totalAttendance.toLocaleString()} </div>
          <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}> Total Attendance </div>
        </div>
      </div>
    </div>
  );
};
// --- End Mock/Sample Components ---

const AIReviewsPage = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // Default to overview

  // --- SIMPLIFIED useEffect to fetch events ---
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors

        // SINGLE API CALL to get events with pre-calculated stats
        const response = await axios.get('/events'); // Make sure axios uses base URL
        console.log("Simplified Events response:", response.data);

        if (response.data && Array.isArray(response.data)) {
           // Directly use the data from backend which includes stats
          const processedEvents = response.data.map(event => ({
            ...event,
            // Format date for display if needed, backend might send DATEONLY string
             date: event.date ? new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date N/A'
             // avgRating, reviewCount, sentimentScore are assumed to be present now
          }));

          console.log("Processed events with stats:", processedEvents);
          setEvents(processedEvents);

          if (processedEvents.length > 0) {
            setSelectedEvent(processedEvents[0]); // Set first event as default
          } else {
             setSelectedEvent(null); // Ensure no event is selected if list is empty
          }
        } else {
          console.warn("No events found or invalid format:", response.data);
          setEvents([]);
           setSelectedEvent(null);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
        setLoading(false);
        setEvents([]); // Ensure events list is empty on error
        setSelectedEvent(null);
      }
    };

    fetchEvents();
  }, []); // Empty dependency array means this runs once on mount
  // --- END OF SIMPLIFIED useEffect ---

  // Handle event selection
  const selectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setActiveTab('overview'); // Reset to overview tab when selecting a new event
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Events List Sidebar */}
        <div className="col-lg-3">
          <div className="card shadow-sm mb-4">
            <div className="card-header py-3" style={{ backgroundColor: colors.secondary, color: 'white' }}>
              <h2 className="m-0 fs-5">Events</h2>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush" role="listbox" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {events.length > 0 ? (
                  events.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      selectedEvent={selectedEvent}
                      selectEvent={selectEvent}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted">No events available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* About Section (Optional) */}
           <div className="card shadow-sm d-none d-lg-block">
            <div className="card-header" style={{ backgroundColor: colors.secondary, color: 'white' }}>
              <h3 className="m-0 fs-5">About AI Reviews</h3>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.9rem', color: colors.textLight }}>
                Our AI analyzes event reviews, attendance data, and engagement metrics to provide comprehensive insights. This helps:
              </p>
              <ul style={{ fontSize: '0.9rem', color: colors.textLight }}>
                <li className="mb-2">Understand attendee satisfaction</li>
                <li className="mb-2">Identify improvement opportunities</li>
                <li className="mb-2">Track engagement patterns</li>
                <li className="mb-2">Highlight impactful aspects</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-lg-9">
          {selectedEvent ? (
            <>
              {/* Event Header Card */}
              <div className="card shadow-sm mb-4">
                <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.light }}>
                  <h2 className="fs-4 m-0" style={{ color: colors.secondary, fontWeight: '600' }}>
                    {selectedEvent.title}
                  </h2>
                  <span className="badge" style={{ backgroundColor: colors.primary, color: 'white' }}>
                    {selectedEvent.category}
                  </span>
                </div>
                <div className="card-body">
                  {/* Key Metrics */}
                  <KeyMetrics selectedEvent={selectedEvent} />

                  {/* Tab Navigation */}
                  <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => handleTabChange('overview')}
                        style={{ color: activeTab === 'overview' ? colors.primary : colors.textLight, fontWeight: activeTab === 'overview' ? '600' : '400' }}
                      > Overview </button>
                    </li>
                     <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'attendance' ? 'active' : ''}`}
                        onClick={() => handleTabChange('attendance')}
                        style={{ color: activeTab === 'attendance' ? colors.primary : colors.textLight, fontWeight: activeTab === 'attendance' ? '600' : '400' }}
                      > Attendance </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'satisfaction' ? 'active' : ''}`}
                        onClick={() => handleTabChange('satisfaction')}
                        style={{ color: activeTab === 'satisfaction' ? colors.primary : colors.textLight, fontWeight: activeTab === 'satisfaction' ? '600' : '400' }}
                      > Satisfaction </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'ratings' ? 'active' : ''}`}
                        onClick={() => handleTabChange('ratings')}
                        style={{ color: activeTab === 'ratings' ? colors.primary : colors.textLight, fontWeight: activeTab === 'ratings' ? '600' : '400' }}
                      > Ratings </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'engagement' ? 'active' : ''}`}
                        onClick={() => handleTabChange('engagement')}
                        style={{ color: activeTab === 'engagement' ? colors.primary : colors.textLight, fontWeight: activeTab === 'engagement' ? '600' : '400' }}
                      > Engagement </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => handleTabChange('reviews')}
                        style={{ color: activeTab === 'reviews' ? colors.primary : colors.textLight, fontWeight: activeTab === 'reviews' ? '600' : '400' }}
                      > Reviews </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'insights' ? 'active' : ''}`}
                        onClick={() => handleTabChange('insights')}
                        style={{ color: activeTab === 'insights' ? colors.primary : colors.textLight, fontWeight: activeTab === 'insights' ? '600' : '400' }}
                      > AI Insights </button>
                    </li>
                  </ul>

                  {/* Tab Content */}
                  <TabContent
                    activeTab={activeTab}
                    selectedEvent={selectedEvent}
                  />
                </div>
              </div>
            </>
          ) : (
            // Placeholder when no event is selected
            <div className="card shadow-sm">
              <div className="card-body text-center p-5">
                <p className="text-muted">Please select an event from the list to view its analytics.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AIReviewsPage;