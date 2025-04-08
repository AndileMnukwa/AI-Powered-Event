import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define the colors (reusing your color scheme)
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

// Updated background style to match AdminAIReviewsDashboard
const backgroundStyle = {
  background: `linear-gradient(135deg, 
    ${colors.light} 0%, 
    ${colors.accent}10 50%, 
    ${colors.primary}10 100%)`,
  minHeight: '100vh',
  paddingTop: '2rem',
  paddingBottom: '2rem'
};

const AIInsights = () => {
  // State for events list
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  
  // State for selected event insights
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [insights, setInsights] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [topicClusters, setTopicClusters] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  // Fetch all events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const token = localStorage.getItem('accessToken');
        
        // FIXED: Use the same API endpoint as AdminAIReviewsDashboard
        const response = await axios.get('https://ai-powered-event-production.up.railway.app/events', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Events Response:', response.data);
        
        // Process event data to include additional metrics like in AdminAIReviewsDashboard
        const processedEvents = await Promise.all(response.data.map(async (event) => {
          // Fetch reviews for this event
          const reviewsResponse = await axios.get(`https://ai-powered-event-production.up.railway.app/events/${event.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const reviews = reviewsResponse.data.reviews || [];
          
          // Calculate metrics
          const reviewCount = reviews.length;
          
          let avgRating = 0;
          if (reviewCount > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            avgRating = (totalRating / reviewCount).toFixed(1);
          }
          
          // Calculate sentiment counts
          const positiveReviews = reviews.filter(review => review.sentiment === 'positive').length;
          const neutralReviews = reviews.filter(review => review.sentiment === 'neutral').length;
          const negativeReviews = reviews.filter(review => review.sentiment === 'negative').length;
          
          // Calculate sentiment score 
          const sentimentScore = reviewCount > 0 ? Math.round((positiveReviews / reviewCount) * 100) : 0;
          
          return {
            ...event,
            sentiment_positive_count: positiveReviews,
            sentiment_neutral_count: neutralReviews,
            sentiment_negative_count: negativeReviews,
            total_reviews: reviewCount,
            average_rating: parseFloat(avgRating),
            sentimentScore,
            reviewCount
          };
        }));
        
        setEvents(processedEvents);
        setLoadingEvents(false);
      } catch (err) {
        console.error("Error fetching events:", err);
        setEventsError("Failed to load events. Please try again later.");
        setLoadingEvents(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Fetch insights when an event is selected
  useEffect(() => {
    if (!selectedEventId) return;
    
    const fetchInsights = async () => {
      try {
        setLoadingInsights(true);
        setInsightsError(null);
        
        const token = localStorage.getItem('accessToken');
        
        // First try to fetch from the expected endpoint
        try {
          const response = await axios.get(`https://ai-powered-event-production.up.railway.app/admin/analytics/reviews/insights/${selectedEventId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log('Insights Response:', response.data);
          
          setInsights(response.data.insights || []);
          setKeywords(response.data.keywords || []);
          setTopicClusters(response.data.topicClusters || []);
        } catch (error) {
          console.log('Primary endpoint failed, trying fallback', error);
          
          // Fallback: Generate insights from reviews if the endpoint fails
          const reviewsResponse = await axios.get(`https://ai-powered-event-production.up.railway.app/events/${selectedEventId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const reviews = reviewsResponse.data.reviews || [];
          
          // Extract keywords from reviews (simplified version)
          const keywords = extractKeywordsFromReviews(reviews);
          
          // Extract topic clusters (simplified version)
          const topicClusters = extractTopicsFromReviews(reviews);
          
          // Generate insights (simplified version)
          const insights = generateInsightsFromReviews(reviews);
          
          setInsights(insights);
          setKeywords(keywords);
          setTopicClusters(topicClusters);
        }
        
        setActiveInsightIndex(0); // Reset to first insight
        setLoadingInsights(false);
      } catch (err) {
        console.error("Error fetching insights:", err);
        setInsightsError("Failed to load insights. Please try again later.");
        setLoadingInsights(false);
      }
    };
    
    fetchInsights();
  }, [selectedEventId]);

  // Helper function to extract keywords from reviews
  const extractKeywordsFromReviews = (reviews) => {
    // Combine all review texts
    const combinedText = reviews.map(r => r.review_text || '').join(' ');
    
    // Simple word frequency counter (excluding common words)
    const commonWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'was', 'were', 'is', 'are'];
    const words = combinedText.toLowerCase().match(/\b(\w+)\b/g) || [];
    const wordCounts = {};
    
    words.forEach(word => {
      if (word.length > 3 && !commonWords.includes(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    // Convert to array and sort by frequency
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([term, count]) => ({ term, count }));
  };

  // Helper function to extract topics from reviews
  const extractTopicsFromReviews = (reviews) => {
    // Define common topics to look for
    const topicKeywords = {
      'venue': ['venue', 'location', 'place', 'facility', 'facilities', 'space'],
      'food': ['food', 'meal', 'catering', 'drinks', 'refreshments'],
      'speakers': ['speaker', 'speakers', 'presentation', 'talk', 'speech', 'presenter'],
      'organization': ['organized', 'organization', 'staff', 'planning', 'schedule', 'agenda'],
      'content': ['content', 'materials', 'information', 'knowledge', 'learn', 'learned', 'educational'],
      'networking': ['network', 'networking', 'people', 'contacts', 'connections', 'socializing']
    };
    
    // Count occurrences of keywords for each topic
    const topicCounts = {};
    
    Object.keys(topicKeywords).forEach(topic => {
      topicCounts[topic] = 0;
      
      reviews.forEach(review => {
        const reviewText = (review.review_text || '').toLowerCase();
        topicKeywords[topic].forEach(keyword => {
          if (reviewText.includes(keyword)) {
            topicCounts[topic]++;
          }
        });
      });
    });
    
    // Convert to array and sort by frequency
    return Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Helper function to generate insights from reviews
  const generateInsightsFromReviews = (reviews) => {
    if (reviews.length < 3) {
      return ["Not enough reviews to generate meaningful insights."];
    }
    
    const insights = [];
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
    insights.push(`Average rating is ${avgRating} out of 5 stars.`);
    
    // Analyze sentiment
    const positiveReviews = reviews.filter(review => review.sentiment === 'positive').length;
    const sentimentPercent = reviews.length > 0 ? Math.round((positiveReviews / reviews.length) * 100) : 0;
    insights.push(`${sentimentPercent}% of reviews express positive sentiment.`);
    
    // Add more generic insights
    insights.push("Most mentioned aspects include event organization and content quality.");
    
    if (sentimentPercent > 75) {
      insights.push("Overall feedback is very positive. Consider highlighting these strengths in marketing materials.");
    } else if (sentimentPercent < 50) {
      insights.push("Consider addressing common issues mentioned in negative reviews to improve future events.");
    }
    
    return insights;
  };

  // Calculate max for keywords scale
  const maxKeywordCount = keywords.length > 0 
    ? Math.max(...keywords.map(k => k.count)) 
    : 0;
    
  // Calculate max for topics scale  
  const maxTopicCount = topicClusters.length > 0 
    ? Math.max(...topicClusters.map(t => t.count)) 
    : 0;

  // Function to select an event
  const handleSelectEvent = (eventId, eventTitle) => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(eventTitle);
    window.scrollTo(0, 0); // Scroll to top for better UX
  };

  // Function to go back to events list
  const handleBackToEvents = () => {
    setSelectedEventId(null);
    setSelectedEventTitle('');
    setInsights([]);
    setKeywords([]);
    setTopicClusters([]);
  };

  // Loading state for events
  if (loadingEvents) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border" role="status" style={{ color: colors.primary }}>
          <span className="visually-hidden">Loading events...</span>
        </div>
      </div>
    );
  }

  // Error state for events
  if (eventsError) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-circle-fill me-2"></i>
        {eventsError}
      </div>
    );
  }

  // No events found
  if (events.length === 0) {
    return (
      <div className="text-center p-4 bg-light rounded">
        <i className="bi bi-calendar-x me-2 fs-1" style={{ color: colors.accent }}></i>
        <p className="lead">No events with analytics data found.</p>
        <p>Events will appear here once they have been created and have received reviews.</p>
      </div>
    );
  }

  // Show insights for selected event
  if (selectedEventId) {
    return (
      <div style={backgroundStyle} className="container-fluid">
        <div className="container">
          <div className="row mb-4">
            <div className="col-12">
              <button 
                className="btn btn-sm btn-outline-secondary mb-3"
                onClick={handleBackToEvents}
              >
                <i className="bi bi-arrow-left me-1"></i> Back to All Events
              </button>
              
              <h4 className="mb-3">{selectedEventTitle}</h4>
            </div>
          </div>
        </div>
        
        <div className="container">
          {/* Loading state for insights */}
          {loadingInsights && (
            <div className="d-flex justify-content-center align-items-center p-5">
              <div className="spinner-border" role="status" style={{ color: colors.primary }}>
                <span className="visually-hidden">Loading insights...</span>
              </div>
            </div>
          )}
          
          {/* Error state for insights */}
          {insightsError && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              {insightsError}
            </div>
          )}
          
          {/* No insights state */}
          {!loadingInsights && !insightsError && insights.length === 0 && (
            <div className="text-center p-4 bg-light rounded">
              <i className="bi bi-robot me-2 fs-1" style={{ color: colors.accent }}></i>
              <p className="lead">Not enough reviews to generate meaningful insights yet.</p>
              <p>AI insights become available when more users submit reviews for this event.</p>
            </div>
          )}
          
          {/* Insights content */}
          {!loadingInsights && !insightsError && insights.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-header d-flex justify-content-between align-items-center" 
                  style={{ backgroundColor: colors.secondary, color: "white" }}>
                <h5 className="mb-0">
                  <i className="bi bi-lightbulb-fill me-2" style={{ color: colors.accent }}></i>
                  Advanced AI Review Analysis
                </h5>
              </div>
              <div className="card-body p-4">
                {/* Featured Insight */}
                <div className="p-4 mb-4 rounded" style={{ 
                  backgroundColor: "rgba(65, 201, 226, 0.1)", 
                  borderLeft: `4px solid ${colors.accent}` 
                }}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="me-3">
                      <i className="bi bi-braces-asterisk fs-1" style={{ color: colors.accent }}></i>
                    </div>
                    <div>
                      <h5 className="mb-1" style={{ color: colors.secondary }}>Key Insight</h5>
                      <p className="mb-0 fs-5" style={{ color: colors.text }}>
                        {insights[activeInsightIndex] || "No insights available yet."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Insight Navigation */}
                  <div className="d-flex justify-content-between mt-3">
                    <button 
                      className="btn btn-sm" 
                      onClick={() => setActiveInsightIndex(prev => (prev > 0 ? prev - 1 : insights.length - 1))}
                      style={{ 
                        backgroundColor: colors.secondary, 
                        color: "white", 
                        opacity: insights.length > 1 ? 1 : 0.5,
                        cursor: insights.length > 1 ? "pointer" : "not-allowed"
                      }}
                      disabled={insights.length <= 1}
                    >
                      <i className="bi bi-chevron-left me-1"></i> Previous
                    </button>
                    <div style={{ color: colors.textLight }}>
                      {activeInsightIndex + 1} of {insights.length}
                    </div>
                    <button 
                      className="btn btn-sm" 
                      onClick={() => setActiveInsightIndex(prev => (prev < insights.length - 1 ? prev + 1 : 0))}
                      style={{ 
                        backgroundColor: colors.primary, 
                        color: "white",
                        opacity: insights.length > 1 ? 1 : 0.5,
                        cursor: insights.length > 1 ? "pointer" : "not-allowed"
                      }}
                      disabled={insights.length <= 1}
                    >
                      Next <i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
                
                <div className="row">
                  {/* Keywords Analysis */}
                  <div className="col-md-6 mb-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header py-3" style={{ backgroundColor: colors.light }}>
                        <h5 className="mb-0" style={{ color: colors.secondary }}>
                          <i className="bi bi-tags-fill me-2" style={{ color: colors.primary }}></i>
                          Key Terms in Reviews
                        </h5>
                      </div>
                      <div className="card-body">
                        {keywords.length > 0 ? (
                          <div>
                            {keywords.slice(0, 8).map((keyword, index) => (
                              <div key={index} className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                  <span style={{ color: colors.text, fontWeight: "500" }}>
                                    {keyword.term}
                                  </span>
                                  <span style={{ color: colors.textLight }}>
                                    {keyword.count} mentions
                                  </span>
                                </div>
                                <div className="progress" style={{ height: "12px" }}>
                                  <div 
                                    className="progress-bar" 
                                    role="progressbar" 
                                    style={{ 
                                      width: `${(keyword.count / maxKeywordCount) * 100}%`, 
                                      backgroundColor: colors.chart[index % colors.chart.length],
                                      borderRadius: "6px" 
                                    }} 
                                    aria-valuenow={keyword.count} 
                                    aria-valuemin="0" 
                                    aria-valuemax={maxKeywordCount}
                                  />
                                </div>
                              </div>
                            ))}
                            <p className="text-muted mt-3 small">
                              <i className="bi bi-info-circle me-1"></i>
                              These terms represent the most frequently mentioned concepts in user reviews.
                            </p>
                          </div>
                        ) : (
                          <p className="text-center text-muted py-4">No keyword data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Topic Analysis */}
                  <div className="col-md-6 mb-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header py-3" style={{ backgroundColor: colors.light }}>
                        <h5 className="mb-0" style={{ color: colors.secondary }}>
                          <i className="bi bi-chat-square-text me-2" style={{ color: colors.primary }}></i>
                          Topic Sentiment Analysis
                        </h5>
                      </div>
                      <div className="card-body">
                        {topicClusters.length > 0 ? (
                          <div>
                            {topicClusters.map((topic, index) => (
                              <div key={index} className="mb-3 p-2 rounded" style={{
                                backgroundColor: index % 2 === 0 ? colors.light : 'white'
                              }}>
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <span style={{ 
                                    color: colors.secondary, 
                                    fontWeight: "600",
                                    textTransform: "capitalize" 
                                  }}>
                                    {topic.topic}
                                  </span>
                                  <span className="badge" style={{ 
                                    backgroundColor: colors.chart[index % colors.chart.length],
                                    color: "white" 
                                  }}>
                                    {topic.count} mentions
                                  </span>
                                </div>
                                <div className="progress" style={{ height: "12px" }}>
                                  <div 
                                    className="progress-bar" 
                                    role="progressbar" 
                                    style={{ 
                                      width: `${(topic.count / maxTopicCount) * 100}%`, 
                                      backgroundColor: colors.chart[index % colors.chart.length],
                                      borderRadius: "6px" 
                                    }} 
                                    aria-valuenow={topic.count} 
                                    aria-valuemin="0" 
                                    aria-valuemax={maxTopicCount}
                                  />
                                </div>
                              </div>
                            ))}
                            <p className="text-muted mt-3 small">
                              <i className="bi bi-info-circle me-1"></i>
                              Topics are grouped from keywords to identify common themes in reviews.
                            </p>
                          </div>
                        ) : (
                          <p className="text-center text-muted py-4">No topic data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* All Insights Panel */}
                <div className="card shadow-sm mt-3">
                  <div className="card-header py-3" style={{ backgroundColor: colors.light }}>
                    <h5 className="mb-0" style={{ color: colors.secondary }}>
                      <i className="bi bi-lightbulb me-2" style={{ color: colors.primary }}></i>
                      All AI-Generated Insights
                    </h5>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      {insights.map((insight, index) => (
                        <li key={index} className="list-group-item border-bottom py-3">
                          <div className="d-flex">
                            <div className="me-3">
                              <span 
                                className="badge rounded-circle p-2"
                                style={{ backgroundColor: colors.chart[index % colors.chart.length] }}
                              >
                                {index + 1}
                              </span>
                            </div>
                            <div style={{ color: colors.text }}>{insight}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show list of events with matching header style from AdminAIReviewsDashboard
  return (
    <div style={backgroundStyle} className="container-fluid">
      <div className="container">
        <div className="row mb-5">
          <div className="col-12 text-center">
            <h1 
              style={{ 
                color: colors.secondary, 
                fontWeight: '700',
                fontSize: '2.5rem',
                marginBottom: '0.5rem',
                letterSpacing: '-0.5px',
                textShadow: '1px 1px 2px rgba(13, 27, 64, 0.05)'
              }}
            >
              AI Insights
            </h1>
            <p 
              className="lead text-muted"
              style={{
                fontWeight: '300',
                color: `${colors.textLight}`,
                letterSpacing: '0.5px',
                maxWidth: '600px',
                margin: '0 auto'
              }}
            >
              Transforming event feedback into actionable intelligence
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          {events.map((event, index) => {
            // Determine the event details
            const eventId = event.id;
            const eventTitle = event.title || `Event #${eventId}`;
            const reviewCount = event.reviewCount || event.total_reviews || 0;
            const avgRating = event.avgRating || event.average_rating || 0;
            const sentimentScore = event.sentimentScore || calculateSentimentScore(event);
            
            // Check if we have insights data
            const hasInsights = reviewCount > 0;
            const firstInsight = hasInsights ? 
              "Click to view AI-generated insights for this event." : 
              "Not enough reviews to generate insights.";
            
            return (
              <div key={index} className="col-md-6 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header py-2" style={{ backgroundColor: colors.secondary, color: "white" }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{eventTitle}</h5>
                      <span className="badge rounded-pill" style={{ backgroundColor: colors.accent }}>
                        {reviewCount} Reviews
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-6 text-center">
                        <div className="p-2 rounded bg-light">
                          <div className="text-muted small">Average Rating</div>
                          <div className="fs-4 fw-bold" style={{ color: colors.primary }}>
                            {avgRating.toFixed(1)}<span className="fs-6">/5</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-6 text-center">
                        <div className="p-2 rounded bg-light">
                          <div className="text-muted small">Sentiment</div>
                          <div className="fs-4 fw-bold" style={{ 
                            color: getSentimentColor(sentimentScore)
                          }}>
                            {sentimentScore}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded mb-3" style={{ 
                      backgroundColor: "rgba(65, 201, 226, 0.1)", 
                      borderLeft: `4px solid ${colors.accent}` 
                    }}>
                      <div className="text-muted small mb-1">AI Insights:</div>
                      <div style={{ color: colors.text }}>
                        {firstInsight}
                      </div>
                    </div>
                    
                    <div className="text-center mt-3">
                      <button 
                        className="btn" 
                        onClick={() => handleSelectEvent(eventId, eventTitle)}
                        style={{ 
                          backgroundColor: colors.primary,
                          color: 'white'
                        }}
                        disabled={reviewCount < 1}
                      >
                        <i className="bi bi-graph-up me-2"></i>
                        View Detailed Insights
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate sentiment score
const calculateSentimentScore = (event) => {
  const positive = event.sentiment_positive_count || 0;
  const neutral = event.sentiment_neutral_count || 0;
  const negative = event.sentiment_negative_count || 0;
  const total = positive + neutral + negative;
  
  if (total === 0) return 0;
  
  // Calculate weighted score: positive counts fully, neutral counts as half positive
  return Math.round(((positive + (neutral * 0.5)) / total) * 100);
};

// Helper function to get color based on sentiment score
const getSentimentColor = (score) => {
  if (score >= 80) return "#44D7B6"; // Green
  if (score >= 60) return "#41C9E2"; // Blue
  if (score >= 40) return "#FFD700"; // Yellow
  if (score >= 20) return "#FF9E6D"; // Orange
  return "#FF5A8E"; // Red
};

export default AIInsights;