import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import reviewsImage from "../images/reviews.jpg";
import eventImage from "../images/flex.jpg";
import BannerSlideshow from '../components/BannerSlideshow';
import API from '../services/api';

// Add global style reset
const globalStyle = `
  body, html {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredEventId, setHoveredEventId] = useState(null);

  // Animation for reveal on scroll using Intersection Observer instead of scroll events
  const [visibleSections, setVisibleSections] = useState({
    hero: false,
    events: false,
    features: false,
    cta: false
  });

  useEffect(() => {
    // Fetch events from API
    API
      .get("https://ai-powered-event-production.up.railway.app/events")
      .then((response) => {
        // Get only upcoming events and limit to 3
        const today = new Date();
        const upcoming = response.data
          .filter((event) => new Date(event.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setFeaturedEvents(upcoming);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        // Fallback sample events in case API fails
        setFeaturedEvents([
          {
            id: 1,
            title: "Summer Music Festival",
            date: "2025-06-15",
            time: "16:00:00",
            location: "Central Park",
            category: "Music",
            image: "/api/placeholder/600/400"
          },
          {
            id: 2,
            title: "Tech Conference 2025",
            date: "2025-04-22",
            time: "09:00:00",
            location: "Convention Center",
            category: "Technology",
            image: "/api/placeholder/600/400"
          },
          {
            id: 3,
            title: "Food & Wine Expo",
            date: "2025-05-10",
            time: "12:00:00",
            location: "Downtown Gallery",
            category: "Food",
            image: "/api/placeholder/600/400"
          }
        ]);
        setLoading(false);
      });

    // Using Intersection Observer for better performance
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.25
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id.replace('-section', '');
          setVisibleSections(prev => ({
            ...prev,
            [sectionId]: true
          }));

          // Once a section is visible, we can stop observing it
          sectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe each section
    const sections = ['hero-section', 'events-section', 'features-section', 'cta-section'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) sectionObserver.observe(element);
    });

    return () => {
      // Cleanup
      sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) sectionObserver.unobserve(element);
      });
    };
  }, []);

  // Function to correct image path (similar to AdminDashboard)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/api/placeholder/600/400";

    // If the path already starts with http or is a placeholder, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('/api/placeholder')) return imagePath;

    // If the path begins with "/uploads/events/", remove the leading slash
    if (imagePath.startsWith('/uploads/events/')) {
      return `https://ai-powered-event-production.up.railway.app${imagePath}`;
    }

    // For any other case, just append the path to the base URL
    return `https://ai-powered-event-production.up.railway.app/${imagePath}`;
  };

  // Theming with design tokens
  const theme = {
    colors: {
      primary: "#FF5A8E", // Vibrant pink
      secondary: "#0D1B40", // Deep navy
      accent: "#41C9E2", // Bright turquoise accent
      dark: "#081029", // Very dark navy, almost black
      light: "#FFF5F8", // Very light pink (off-white with pink tint)
      text: "#0D1B40", // Navy for main text
      textLight: "#6C7A9C" // Muted navy for secondary text
    },
    shadows: {
      sm: '0 4px 15px rgba(255, 90, 142, 0.2)',
      md: '0 8px 25px rgba(255, 90, 142, 0.4)',
      lg: '0 20px 50px rgba(13, 27, 64, 0.2)'
    },
    transitions: {
      default: 'all 0.3s ease',
      slow: 'all 0.8s ease',
      delayed: 'all 1s ease 0.2s'
    },
    borderRadius: {
      sm: '6px',
      md: '8px',
      lg: '16px'
    }
  };

  // Button component for consistent styling and DRY code
  const Button = ({ primary, children, onClick, className = '' }) => (
    <button
      className={`btn btn-lg ${className}`}
      onClick={onClick}
      onMouseEnter={primary ? () => setIsHovered(true) : undefined}
      onMouseLeave={primary ? () => setIsHovered(false) : undefined}
      style={{
        background: primary
          ? (isHovered ? '#E04578' : theme.colors.primary)
          : 'transparent',
        color: primary ? 'white' : theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        padding: '0.75rem 2rem',
        fontSize: '1.1rem',
        fontWeight: '600',
        boxShadow: primary
          ? (isHovered ? theme.shadows.md : theme.shadows.sm)
          : 'none',
        border: primary ? 'none' : `2px solid ${theme.colors.primary}`,
        transition: theme.transitions.default,
        transform: primary && isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      {children}
    </button>
  );

  // Shared section transition properties
  const getSectionStyle = (isVisible) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: theme.transitions.slow
  });

  return (
    <>
      <style>{globalStyle}</style>
      <div className="d-flex flex-column min-vh-100" style={{
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        overflowX: 'hidden',
        color: theme.colors.text,
        background: theme.colors.light,
        margin: 0,
        padding: 0,
        marginTop: "-80px" // Compensate for the global padding
      }}>
        {/* Hero Section - With background image and modern design */}
        <section
          id="hero-section"
          className="d-flex align-items-center"
          style={{
            background: `url('/api/placeholder/1920/1080') no-repeat center center`,
            backgroundSize: 'cover',
            position: 'relative',
            padding: '6rem 0',
            marginTop: 0,
            minHeight: '100vh',
            ...getSectionStyle(visibleSections.hero)
          }}
        >
          {/* Dark overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, rgba(13, 27, 64, 0.85) 0%, rgba(255, 90, 142, 0.75) 100%)`,
            zIndex: 1
          }}></div>

          <div className="container position-relative" style={{ zIndex: 2 }}>
            <div className="row align-items-center">
              <div className="col-lg-6 text-white">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  padding: '2.5rem',
                  borderRadius: theme.borderRadius.lg,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
                }}>
                  <h1 className="display-4 fw-bold mb-4" style={{
                    color: 'white',
                    fontWeight: '800',
                    letterSpacing: '-0.5px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}>
                    Experience Events Through <span style={{ color: theme.colors.primary }}>Vibe</span>Catcher
                  </h1>

                  <p className="lead mb-5" style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '1.25rem',
                    lineHeight: '1.6'
                  }}>
                    VibeCatcher transforms how you discover, experience, and remember events with cutting-edge artificial intelligence that personalizes every moment.
                  </p>

                  {/* Updated buttons for clearer navigation */}
                  <div className="d-flex flex-column flex-sm-row gap-3">
                    <Button primary onClick={() => navigate('/registration')}>
                      Register
                    </Button>
                    <button
                      className="btn btn-lg"
                      onClick={() => navigate('/login')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        borderRadius: theme.borderRadius.md,
                        padding: '0.75rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(5px)',
                        transition: theme.transitions.default
                      }}
                    >
                      Login
                    </button>
                  </div>
                </div>
              </div>

              {/* Update this section in your LandingPage component */}
              <div className="col-lg-6 d-none d-lg-block d-flex align-items-center justify-content-center">
                <div className="position-relative" style={{
                  width: '100%',
                  maxWidth: '500px',
                  aspectRatio: '1/1',
                  margin: '0 auto'
                }}>
                  <BannerSlideshow theme={theme} isCircular={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Animated scroll indicator */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4" style={{ zIndex: 2 }}>
            <a href="#events-section" className="text-white text-decoration-none">
              <div className="d-flex flex-column align-items-center">
                <span className="mb-2">Scroll to explore</span>
                <i className="bi bi-chevron-down" style={{
                  fontSize: '1.5rem',
                  animation: 'bounce 2s infinite'
                }}></i>
              </div>
            </a>
          </div>

          {/* Add animation for the scroll indicator */}
          <style jsx>{`
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-20px); }
              60% { transform: translateY(-10px); }
            }
          `}</style>
        </section>

        {/* Featured Events Section (New Modern Layout) */}
        <section
          id="events-section"
          className="py-5"
          style={{
            background: '#f8f9fa',
            padding: '6rem 0 8rem',
            position: 'relative',
            ...getSectionStyle(visibleSections.events)
          }}
        >
          <div className="position-absolute top-0 left-0 w-100 h-100" style={{
            backgroundImage: 'radial-gradient(circle at 20% 90%, rgba(255, 90, 142, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 30%, rgba(65, 201, 226, 0.1) 0%, transparent 40%)',
            zIndex: 1
          }}></div>

          <div className="container position-relative" style={{ zIndex: 2 }}>
            <div className="row mb-5">
              <div className="col-lg-6">
                <h2 className="display-4 fw-bold mb-2" style={{
                  color: theme.colors.secondary,
                  fontWeight: '800',
                  position: 'relative'
                }}>
                  Trending Events
                </h2>
                <div className="d-inline-block mb-3" style={{
                  width: '120px',
                  height: '5px',
                  background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                  borderRadius: '3px'
                }}></div>
                <p className="lead" style={{ color: theme.colors.textLight }}>
                  Discover popular events curated just for you
                </p>
              </div>
              <div className="col-lg-6 d-flex justify-content-lg-end align-items-end">
                <button
                  className="btn btn-lg"
                  onClick={() => navigate('/events')}
                  style={{
                    background: theme.colors.primary,
                    color: 'white',
                    borderRadius: '30px',
                    padding: '0.75rem 2rem',
                    fontWeight: '600',
                    transition: theme.transitions.default,
                    boxShadow: theme.shadows.md
                  }}
                >
                  View All Events <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center w-100 py-5">
                <div className="spinner-border" style={{ color: theme.colors.primary }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row">
                {featuredEvents.map((event, index) => (
                  <div
                    className="col-lg-4 col-md-6 mb-4"
                    key={event.id}
                    style={{
                      transform: `translateY(${index * 20}px)`,
                      zIndex: 3 - index
                    }}
                  >
                    <div
                      className="event-card position-relative"
                      onClick={() => navigate(`/event/${event.id}`)}
                      style={{
                        cursor: "pointer",
                        borderRadius: '16px',
                        overflow: 'hidden',
                        height: '450px',
                        boxShadow: '0 15px 35px rgba(13, 27, 64, 0.1)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      }}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    >
                      {/* Full height background image */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 1
                      }}>
                        <img
                          src={getImageUrl(event.image)}
                          alt={event.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.6s ease'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)',
                          zIndex: 2
                        }}></div>
                      </div>

                      {/* Content at the bottom of the card */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        padding: '30px',
                        zIndex: 3,
                        color: 'white',
                        transform: hoveredEventId === event.id ? 'translateY(0)' : 'translateY(80px)',
                        transition: 'transform 0.5s ease'
                      }}>
                        {/* Category Badge */}
                        <span className="badge mb-3" style={{
                          backgroundColor: theme.colors.primary,
                          color: 'white',
                          padding: '8px 15px',
                          borderRadius: '30px',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                          opacity: hoveredEventId === event.id ? 0 : 1,
                          transition: 'opacity 0.3s ease'
                        }}>
                          {event.category || "Event"}
                        </span>

                        <h3 className="fw-bold mb-3">{event.title}</h3>

                        <div style={{
                          height: hoveredEventId === event.id ? 'auto' : '0',
                          opacity: hoveredEventId === event.id ? 1 : 0,
                          overflow: 'hidden',
                          transition: 'all 0.5s ease'
                        }}>
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-calendar3 me-2"></i>
                            <span>{format(new Date(event.date), "MMMM dd, yyyy")}</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-clock me-2"></i>
                            <span>{event.time ? format(new Date(`2000-01-01T${event.time}`), "h:mm a") : "TBA"}</span>
                          </div>
                          <div className="d-flex align-items-center mb-3">
                            <i className="bi bi-geo-alt me-2"></i>
                            <span>{event.location}</span>
                          </div>

                          <button
                            className="btn btn-sm mt-2"
                            style={{
                              background: 'white',
                              color: theme.colors.primary,
                              borderRadius: '30px',
                              padding: '8px 20px',
                              fontWeight: '600',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                              border: 'none'
                            }}
                          >
                            View Details <i className="bi bi-chevron-right ms-1"></i>
                          </button>
                        </div>
                      </div>

                      {/* Date Chip */}
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        zIndex: 4,
                        background: 'white',
                        color: theme.colors.secondary,
                        padding: '10px 15px',
                        borderRadius: '12px',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        minWidth: '80px'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                          {format(new Date(event.date), "dd")}
                        </div>
                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                          {format(new Date(event.date), "MMM")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floating decorative elements */}
          <div className="position-absolute" style={{
            bottom: '10%',
            left: '5%',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
            opacity: 0.1,
            zIndex: 1
          }}></div>

          <div className="position-absolute" style={{
            top: '15%',
            right: '8%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: theme.colors.accent,
            opacity: 0.1,
            zIndex: 1
          }}></div>
        </section>

        {/* Features Section */}
        <section
          id="features-section"
          className="py-5"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.light} 0%, rgba(13, 27, 64, 0.05) 100%)`,
            padding: '5rem 0',
            ...getSectionStyle(visibleSections.features)
          }}
        >
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-3" style={{
                color: theme.colors.secondary,
                fontSize: '2.5rem',
                position: 'relative',
                display: 'inline-block'
              }}>
                Intelligent Features
                <span style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80px',
                  height: '4px',
                  background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  borderRadius: '2px'
                }}></span>
              </h2>
              <p className="lead mb-4" style={{ color: theme.colors.textLight }}>
                Discover the power of AI in simplifying your event experiences.
              </p>
            </div>
            <div className="row">
              {/* Card Component */}
              {[
                {
                  title: "Event Personalization",
                  description: "Let AI recommend events that match your interests and preferences.",
                  image: eventImage,
                  buttonText: "Explore Recommendations",
                  path: "/EventPersonalization"
                },
                {
                  title: "AI Reviews & Insights",
                  description: "Get intelligent insights and detailed analytics on events.",
                  image: reviewsImage,
                  buttonText: "View Insights",
                  path: "/AIReviewsPage"
                }
              ].map((card, index) => (
                <div className="col-lg-6 col-md-6 mb-4" key={index}>
                  <div
                    className="card shadow-sm border-0 rounded-lg h-100"
                    style={{
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: theme.transitions.default
                    }}
                    onClick={() => navigate(card.path)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = theme.shadows.md;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = theme.shadows.sm;
                    }}
                  >
                    <img src={card.image} alt={card.title} className="card-img-top" />
                    <div className="card-body" style={{ background: theme.colors.light }}>
                      <h5 className="card-title" style={{ color: theme.colors.primary }}>{card.title}</h5>
                      <p className="card-text" style={{ color: theme.colors.textLight }}>
                        {card.description}
                      </p>
                      <div className="mt-3">
                        <button
                          className="btn btn-sm"
                          style={{
                            background: theme.colors.primary,
                            color: 'white',
                            borderRadius: theme.borderRadius.sm,
                            padding: '8px 16px',
                            fontWeight: '600',
                            transition: theme.transitions.default,
                            border: 'none'
                          }}
                        >
                          {card.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section
          id="cta-section"
          className="py-5 text-center"
          style={{
            background: theme.colors.primary,
            color: 'white',
            ...getSectionStyle(visibleSections.cta)
          }}
        >
          <div className="container">
            <h3 className="display-4 mb-4">Join the Future of Event Discovery</h3>
            <p className="lead mb-5">
              Register now to start exploring and experiencing events powered by AI!
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <button
                className="btn btn-lg"
                onClick={() => navigate('/register')}
                style={{
                  background: 'white',
                  color: theme.colors.primary,
                  padding: '1rem 3rem',
                  borderRadius: theme.borderRadius.md,
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  boxShadow: '0 10px 20px rgba(255, 255, 255, 0.2)'
                }}
              >
                Register
              </button>
              <button
                className="btn btn-lg"
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  color: 'white',
                  padding: '1rem 3rem',
                  borderRadius: theme.borderRadius.md,
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  border: '2px solid white'
                }}
              >
                Login
              </button>
            </div>
          </div>
        </section>

        {/* Add Event Card Animation Styles */}
        <style jsx>{`
          .event-card {
            transition: all 0.3s ease;
          }
          
          .event-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 30px rgba(13, 27, 64, 0.2) !important;
          }
          
          .event-card:hover img {
            transform: scale(1.1);
          }
        `}</style>
      </div>
    </>
  );
};

export default LandingPage;