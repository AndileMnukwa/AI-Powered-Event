// src/pages/EventRegistration.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../helpers/AuthContext';
import { format } from 'date-fns';
import API  from '../services/api';

function EventRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  
  // Event state
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState(1);
  
  // Registration state
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Custom colors from your palette
  const primaryColor = "#1A2A56"; // Navy
  const accentColor = "#FF6B6B";  // Coral/pink

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await API.get(`https://ai-powered-event-production.up.railway.app/events/${id}`);
        if (response.data.event) {
          setEvent(response.data.event);
          
          // Calculate initial total amount
          if (response.data.event.isPaid) {
            setTotalAmount(response.data.event.price * ticketQuantity);
          }
        } else {
          setError("Event not found.");
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to load event details.");
        setLoading(false);
        console.error("Error fetching event details:", err);
      }
    };
    
    fetchEventDetails();
  }, [id]);
  
  // Update total amount when ticket quantity changes
  useEffect(() => {
    if (event && event.isPaid) {
      setTotalAmount(event.price * ticketQuantity);
    }
  }, [ticketQuantity, event]);
  
  // Populate form with user data if logged in
  useEffect(() => {
    if (authState.status && authState.username) {
      setEmail(authState.username); // Assuming username is email
      
      // Optional: fetch more user details if available
      const fetchUserProfile = async () => {
        try {
          const response = await API.get('https://ai-powered-event-production.up.railway.app/api/user/profile', {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
          });
          
          if (response.data) {
            setFullName(response.data.fullName || '');
            setPhone(response.data.phone || '');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      
      fetchUserProfile();
    }
  }, [authState]);
  
  const validateForm = () => {
    if (!fullName.trim()) return "Full name is required";
    if (!email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email";
    if (!phone.trim()) return "Phone number is required";
    return null;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      // Prepare registration data
      const registrationPayload = {
        eventId: id,
        fullName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        specialRequirements,
        ticketQuantity,
        paymentStatus: event.isPaid ? 'pending' : 'free',
        totalAmount: event.isPaid ? totalAmount : 0
      };
      
      // Add userId if logged in
      if (authState.status) {
        registrationPayload.userId = authState.id;
      }
      
      // Submit registration
      const response = await API.post(
        'https://ai-powered-event-production.up.railway.app/registrations',
        registrationPayload,
        authState.status ? {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        } : {}
      );
      
      // Handle successful registration
      setRegistrationData(response.data);
      setRegistrationComplete(true);
      
      // If event is free, show success message
      if (!event.isPaid) {
        // No payment needed, registration is complete
      } else {
        // For paid events, we'll show payment options
      }
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentCompleted = (paymentInfo) => {
    // This will be implemented later with Stripe
    console.log('Payment completed:', paymentInfo);
    
    // For now, we'll just show a success message
    alert('Payment completed successfully!');
    
    // Redirect to the event page
    navigate(`/event/${id}`);
  };
  
  // Handle interim payment (manual payment for now)
  const handleManualPayment = () => {
    alert(`Please complete your payment of $${totalAmount.toFixed(2)} at the event. Your registration is confirmed but payment is pending.`);
    navigate(`/event/${id}`);
  };
  
  if (loading && !event) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border" role="status" style={{ color: accentColor }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error && !event) {
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </div>
        <button
          className="btn mt-3"
          onClick={() => navigate("/")}
          style={{ backgroundColor: primaryColor, color: "white" }}
        >
          <i className="fas fa-home me-2"></i>Back to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="container my-5">
      <div className="card shadow-sm">
        <div className="card-header" style={{ backgroundColor: primaryColor, color: "white" }}>
          <h2 className="mb-0 d-flex align-items-center">
            <i className="fas fa-ticket-alt me-2"></i>
            {registrationComplete ? 'Registration Confirmed' : 'Register for Event'}
          </h2>
        </div>
        
        <div className="card-body">
          {/* Event Information Section */}
          <div className="row mb-4">
            <div className="col-md-8">
              <h3>{event?.title}</h3>
              <p className="text-muted">
                <i className="fas fa-calendar-day me-2"></i>
                {event?.date ? format(new Date(event.date), "MMMM dd, yyyy") : "Date not provided"}
                <span className="mx-3">|</span>
                <i className="fas fa-clock me-2"></i>
                {event?.time ? format(new Date(`2000-01-01T${event.time}`), "h:mm a") : "Time not specified"}
              </p>
              <p>
                <i className="fas fa-map-marker-alt me-2"></i>
                {event?.location}
              </p>
              {event?.isPaid && (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  This is a paid event. Ticket price: <strong>${parseFloat(event.price).toFixed(2)}</strong> per person.
                </div>
              )}
            </div>
            
            <div className="col-md-4 text-end">
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/event/${id}`)}
              >
                <i className="fas fa-arrow-left me-2"></i>Back to Event
              </button>
            </div>
          </div>
          
          {error && <div className="alert alert-danger mb-4">{error}</div>}
          
          {!registrationComplete ? (
            /* Registration Form */
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="fullName" className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="phone" className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="ticketQuantity" className="form-label">Number of Tickets *</label>
                  <input
                    type="number"
                    className="form-control"
                    id="ticketQuantity"
                    min="1"
                    max={event?.maxRegistrations || 10}
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="address" className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="city" className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="state" className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="zipCode" className="form-label">ZIP Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="specialRequirements" className="form-label">Special Requirements or Notes</label>
                <textarea
                  className="form-control"
                  id="specialRequirements"
                  rows="3"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                ></textarea>
              </div>
              
              {event?.isPaid && (
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Order Summary</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Ticket Price:</span>
                      <span>${parseFloat(event.price).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Quantity:</span>
                      <span>{ticketQuantity}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total Amount:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="d-grid">
                <button
                  type="submit"
                  className="btn btn-lg"
                  disabled={loading}
                  style={{ backgroundColor: accentColor, color: "white" }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle me-2"></i>
                      Complete Registration
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Registration Confirmation */
            <div className="text-center py-4">
              <div className="mb-4">
                <i className="fas fa-check-circle fa-4x" style={{ color: "#28a745" }}></i>
                <h3 className="mt-3">Registration Successful!</h3>
                <p className="lead">Thank you for registering for this event.</p>
                <p>Your confirmation code: <strong>{registrationData?.confirmationCode}</strong></p>
                <p>A confirmation email has been sent to your email address.</p>
              </div>
              
              {event?.isPaid && (
                <div className="card mb-4 mx-auto" style={{ maxWidth: "500px" }}>
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Payment Information</h5>
                  </div>
                  <div className="card-body">
                    <p>To complete your registration, please make a payment of:</p>
                    <h3 className="mb-4">${totalAmount.toFixed(2)}</h3>
                    
                    {/* Placeholder for future Stripe integration */}
                    <div className="alert alert-info">
                      <p>
                        <i className="fas fa-info-circle me-2"></i>
                        Our online payment system is currently being upgraded.
                      </p>
                      <p className="mb-0">
                        You can pay at the event or contact the organizer for payment options.
                      </p>
                    </div>
                    
                    <button
                      className="btn mt-3"
                      onClick={handleManualPayment}
                      style={{ backgroundColor: accentColor, color: "white" }}
                    >
                      <i className="fas fa-check me-2"></i>
                      I'll Pay at the Event
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  className="btn me-3"
                  onClick={() => navigate(`/event/${id}`)}
                  style={{ backgroundColor: primaryColor, color: "white" }}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Return to Event
                </button>
                
                {authState.status && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/my-registrations')}
                  >
                    <i className="fas fa-ticket-alt me-2"></i>
                    View My Registrations
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventRegistration;