// src/pages/MyRegistrations.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../helpers/AuthContext';
import { format } from 'date-fns';

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();

  // Navy color from your palette
  const primaryColor = "#1A2A56";
  // Coral color from your palette
  const accentColor = "#FF6B6B";

  useEffect(() => {
    // Redirect if not logged in
    if (!authState.status) {
      navigate('/login');
      return;
    }

    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://ai-powered-event-production.up.railway.app/registrations/user/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        
        // Process the data to ensure totalAmount is a number
        const processedRegistrations = response.data.map(registration => ({
          ...registration,
          totalAmount: registration.totalAmount ? parseFloat(registration.totalAmount) : 0
        }));
        
        setRegistrations(processedRegistrations);
      } catch (err) {
        console.error('Error fetching registrations:', err);
        setError('Failed to load your registrations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [authState.status, navigate]);

  const downloadTicket = (registration) => {
    // In a real app, you would generate a PDF ticket here
    // For now, we'll just show the confirmation details
    alert(`Ticket information:
Event: ${registration.Event.title}
Date: ${format(new Date(registration.Event.date), 'MMMM dd, yyyy')}
Attendee: ${registration.fullName}
Confirmation Code: ${registration.confirmationCode}
Tickets: ${registration.ticketQuantity}
    `);
  };

  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border" role="status" style={{ color: accentColor }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-sm">
        <div className="card-header" style={{ backgroundColor: primaryColor, color: "white" }}>
          <h2 className="mb-0">My Event Registrations</h2>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {registrations.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-calendar-times fa-4x mb-3" style={{ color: "#ccc" }}></i>
              <h3>No Registrations Found</h3>
              <p className="text-muted">You haven't registered for any events yet.</p>
              <button 
                className="btn mt-3" 
                onClick={() => navigate('/home')}
                style={{ backgroundColor: accentColor, color: "white" }}
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="row">
              {registrations.map(registration => (
                <div className="col-md-6 mb-4" key={registration.id}>
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{registration.Event.title}</h5>
                      <span className={`badge ${
                        new Date(registration.Event.date) < new Date() 
                          ? (registration.checkInStatus ? "bg-success" : "bg-secondary")
                          : "bg-primary"
                      }`}>
                        {new Date(registration.Event.date) < new Date()
                          ? (registration.checkInStatus ? "Attended" : "Missed")
                          : "Upcoming"}
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong><i className="fas fa-calendar-day me-2"></i>Event Date:</strong>
                        <p>{format(new Date(registration.Event.date), 'MMMM dd, yyyy')}</p>
                      </div>
                      
                      <div className="mb-3">
                        <strong><i className="fas fa-ticket-alt me-2"></i>Registration Details:</strong>
                        <p>
                          Confirmation Code: <span className="badge bg-dark">{registration.confirmationCode}</span><br />
                          Registration Date: {format(new Date(registration.registrationDate), 'MMM dd, yyyy')}<br />
                          Tickets: {registration.ticketQuantity}
                        </p>
                      </div>
                      
                      <div className="mb-3">
                        <strong><i className="fas fa-dollar-sign me-2"></i>Payment Information:</strong>
                        <p>
                          Status: <span className={`badge ${
                            registration.paymentStatus === 'completed' ? 'bg-success' :
                            registration.paymentStatus === 'pending' ? 'bg-warning' :
                            registration.paymentStatus === 'free' ? 'bg-info' : 'bg-danger'
                          }`}>
                            {registration.paymentStatus.charAt(0).toUpperCase() + registration.paymentStatus.slice(1)}
                          </span><br />
                          {registration.totalAmount > 0 ? (
                            <>
                              Amount: ${typeof registration.totalAmount === 'number' 
                                ? registration.totalAmount.toFixed(2) 
                                : parseFloat(registration.totalAmount || 0).toFixed(2)}<br />
                              {registration.paymentMethod && `Method: ${registration.paymentMethod}`}
                            </>
                          ) : (
                            'Free Event'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="d-flex justify-content-between">
                        <button 
                          className="btn btn-sm" 
                          onClick={() => downloadTicket(registration)}
                          style={{ backgroundColor: primaryColor, color: "white" }}
                        >
                          <i className="fas fa-download me-2"></i>Download Ticket
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => navigate(`/event/${registration.EventId}`)}
                        >
                          View Event
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}