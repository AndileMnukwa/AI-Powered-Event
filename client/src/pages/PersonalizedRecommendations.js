import React, { useState, useEffect } from 'react';

const PersonalizedRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [user, setUser] = useState(null);

  // Define colors (keeping original color scheme)
  const colors = {
    primary: "#FF5A8E", 
    secondary: "#0D1B40", 
    accent: "#41C9E2", 
    dark: "#081029", 
    light: "#FFF5F8", 
    text: "#0D1B40", 
    textLight: "#6C7A9C", 
    gradient: "linear-gradient(135deg, #FF5A8E 0%, #8676FF 100%)"
  };

  useEffect(() => {
    const fetchUserProfileAndRecommendations = async () => {
      // Reset state
      setLoading(true);
      setError(null);

      try {
        // Retrieve the token from localStorage using the correct key
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        // Fetch user profile
        const profileResponse = await fetch('https://ai-powered-event-production.up.railway.app/api/user/profile', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.message || 'Failed to fetch user profile');
        }

        const userData = await profileResponse.json();
        setUser(userData);

        // Prepare interests (adjust based on your user model)
        const interests = userData.interests || [];

        // Fetch recommendations
        const queryParams = new URLSearchParams({
          userId: userData.id.toString(),
          ...(interests.length && { interests: interests.join(',') })
        });

        const recommendationsResponse = await fetch(`https://ai-powered-event-production.up.railway.app/api/recommendations?${queryParams}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!recommendationsResponse.ok) {
          const errorData = await recommendationsResponse.json();
          throw new Error(errorData.message || 'Failed to fetch recommendations');
        }

        // Parse recommendations
        const recommendationsData = await recommendationsResponse.json();

        // Log received data
        console.log('Recommendations received:', recommendationsData);

        // Update state
        setRecommendations(recommendationsData.recommendations || []);
        setExplanation(recommendationsData.explanation || 'Personalized recommendations based on your profile');
        setLoading(false);
      } catch (err) {
        console.error('Recommendation Fetch Error:', err);
        setError(err.message || 'Failed to load recommendations');
        setLoading(false);
      }
    };

    fetchUserProfileAndRecommendations();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <div className="spinner-border" role="status" style={{ color: colors.primary }}>
          <span className="visually-hidden">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <div className="d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: colors.primary }}></i>
          <strong>{error}</strong>
        </div>
        <details className="mt-2">
          <summary>Troubleshooting Tips</summary>
          <ul>
            <li>Ensure you are logged in</li>
            <li>Check your internet connection</li>
            <li>Verify your authentication token</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </details>
      </div>
    );
  }

  // No recommendations state
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="mb-3">
          <i className="bi bi-search" style={{ fontSize: '2rem', color: colors.primary }}></i>
        </div>
        <h5 style={{ color: colors.secondary }}>No recommendations found</h5>
        <p className="text-muted">
          Try adding more interests to your profile or attending more events to get personalized recommendations.
        </p>
      </div>
    );
  }

  // Recommendations display
  return (
    <div className="personalized-recommendations">
      <div className="mb-4">
        <div className="card shadow-sm">
          <div className="card-header py-3" style={{ 
            background: colors.gradient,
            color: 'white',
            borderRadius: '4px 4px 0 0'
          }}>
            <h5 className="mb-0 d-flex align-items-center">
              <i className="bi bi-magic me-2"></i>
              AI-Powered Recommendations
            </h5>
          </div>
          <div className="card-body bg-light">
            <p className="mb-0">{explanation}</p>
          </div>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {recommendations.map((event) => (
          <div key={event.id} className="col">
            <div className="card h-100 shadow-sm event-card" style={{ 
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              {/* Match score badge */}
              <div className="position-absolute" style={{ 
                top: '10px', 
                right: '10px', 
                zIndex: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '20px',
                padding: '5px 10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                <span style={{ 
                  color: colors.primary, 
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {event.matchScore}% Match
                </span>
              </div>
              
              {/* Event image */}
              <div style={{ height: '180px', overflow: 'hidden' }}>
                {event.image ? (
                  <img 
                    src={event.image.startsWith('http') 
                      ? event.image 
                      : `https://ai-powered-event-production.up.railway.app${event.image}`
                    } 
                    className="card-img-top" 
                    alt={event.title}
                    style={{ 
                      height: '100%', 
                      width: '100%', 
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div 
                    className="d-flex justify-content-center align-items-center"
                    style={{ 
                      height: '100%', 
                      backgroundColor: '#f0f0f0',
                      color: '#aaa'
                    }}
                  >
                    <i className="bi bi-image" style={{ fontSize: '3rem' }}></i>
                  </div>
                )}
              </div>
              
              <div className="card-body">
                <h5 className="card-title" style={{ color: colors.secondary }}>{event.title}</h5>
                <p className="card-text">
                  <i className="bi bi-calendar-event me-2" style={{ color: colors.primary }}></i>
                  {new Date(event.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="card-text">
                  <i className="bi bi-geo-alt me-2" style={{ color: colors.primary }}></i>
                  {event.location}
                </p>
                {event.category && (
                  <span className="badge" style={{ backgroundColor: colors.light, color: colors.primary }}>
                    {event.category}
                  </span>
                )}
              </div>
              <div className="card-footer bg-white border-top-0">
                <p className="text-muted mb-2 small fst-italic">
                  <i className="bi bi-info-circle me-1"></i>
                  {event.reason}
                </p>
                <button 
                  className="btn w-100"
                  style={{ 
                    backgroundColor: colors.primary, 
                    color: 'white'
                  }}
                  onClick={() => window.location.href = `/event/${event.id}`}
                >
                  View Event
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;