// src/pages/AdminRegistrations.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../helpers/AuthContext';
import { format } from 'date-fns';

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();

  // Navy color from your palette
  const primaryColor = "#1A2A56";
  // Coral color from your palette
  const accentColor = "#FF6B6B";

  useEffect(() => {
    // Redirect if not admin
    if (!authState.status || !authState.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        // Fetch all events first
        const eventsResponse = await axios.get('https://ai-powered-event-production.up.railway.app/events', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        setEvents(eventsResponse.data);

        // If we have a specific event selected, fetch registrations for that event
        if (selectedEvent !== 'all' && selectedEvent !== '') {
          const registrationsResponse = await axios.get(
            `https://ai-powered-event-production.up.railway.app/registrations/event/${selectedEvent}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
          );
          setRegistrations(registrationsResponse.data);
        } else {
          // Otherwise, fetch all registrations (admin-only endpoint)
          try {
            const registrationsResponse = await axios.get(
              'https://ai-powered-event-production.up.railway.app/registrations/all',
              { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
            );
            setRegistrations(registrationsResponse.data);
          } catch (allError) {
            console.error('Error fetching all registrations:', allError);
            
            // Fallback: Fetch registrations for each event individually
            const allRegistrations = [];
            for (const event of eventsResponse.data) {
              try {
                const eventRegResponse = await axios.get(
                  `https://ai-powered-event-production.up.railway.app/registrations/event/${event.id}`,
                  { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
                );
                allRegistrations.push(...eventRegResponse.data);
              } catch (eventError) {
                console.warn(`Could not fetch registrations for event ${event.id}:`, eventError);
              }
            }
            
            setRegistrations(allRegistrations);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load registrations: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authState, navigate, selectedEvent]);

  // Filter registrations based on search query
  const filteredRegistrations = registrations.filter(reg => 
    reg.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reg.confirmationCode && reg.confirmationCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle check-in status update
  const handleCheckIn = async (registrationId, currentStatus) => {
    try {
      await axios.put(
        `https://ai-powered-event-production.up.railway.app/registrations/${registrationId}/check-in`,
        { checkInStatus: !currentStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      
      // Update the local state
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === registrationId 
            ? { ...reg, checkInStatus: !reg.checkInStatus, checkInTime: new Date() } 
            : reg
        )
      );
    } catch (error) {
      console.error('Error updating check-in status:', error);
      alert('Failed to update check-in status: ' + (error.response?.data?.error || error.message));
    }
  };

  // Handle sending confirmation email
  const handleSendEmail = async (registrationId) => {
    try {
      await axios.post(
        `https://ai-powered-event-production.up.railway.app/registrations/${registrationId}/resend-email`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      alert('Confirmation email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send confirmation email: ' + (error.response?.data?.error || error.message));
    }
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
          <h2 className="mb-0">Registration Management</h2>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email or confirmation code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  className="btn" 
                  style={{ backgroundColor: accentColor, color: "white" }}
                >
                  <i className="fas fa-search"></i> Search
                </button>
              </div>
            </div>
            <div className="col-md-6">
              <select 
                className="form-select" 
                value={selectedEvent} 
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Event</th>
                  <th>Contact</th>
                  <th>Tickets</th>
                  <th>Payment Status</th>
                  <th>Registration Date</th>
                  <th>Check-In</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map(registration => {
                    const event = events.find(e => e.id === registration.EventId);
                    return (
                      <tr key={registration.id}>
                        <td>
                          <strong>{registration.fullName}</strong><br />
                          <small className="text-muted">Code: {registration.confirmationCode}</small>
                        </td>
                        <td>{event ? event.title : 'Unknown Event'}</td>
                        <td>
                          {registration.email}<br />
                          {registration.phone}
                        </td>
                        <td>
                          {registration.ticketQuantity}<br />
                          <span className={registration.totalAmount > 0 ? 'text-success' : 'text-secondary'}>
                            {registration.totalAmount > 0 ? `$${parseFloat(registration.totalAmount).toFixed(2)}` : 'Free'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            registration.paymentStatus === 'completed' ? 'bg-success' :
                            registration.paymentStatus === 'pending' ? 'bg-warning' :
                            registration.paymentStatus === 'free' ? 'bg-info' : 'bg-danger'
                          }`}>
                            {registration.paymentStatus?.charAt(0).toUpperCase() + registration.paymentStatus?.slice(1) || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          {registration.registrationDate ? format(new Date(registration.registrationDate), 'MMM dd, yyyy') : 'Unknown date'}
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id={`check-in-${registration.id}`}
                              checked={registration.checkInStatus || false}
                              onChange={() => handleCheckIn(registration.id, registration.checkInStatus)}
                              style={{ cursor: 'pointer' }}
                            />
                            <label 
                              className="form-check-label" 
                              htmlFor={`check-in-${registration.id}`}
                              style={{ cursor: 'pointer' }}
                            >
                              {registration.checkInStatus ? 
                                `Checked in: ${registration.checkInTime ? format(new Date(registration.checkInTime), 'h:mm a') : 'Yes'}` : 
                                'Not checked in'}
                            </label>
                          </div>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleSendEmail(registration.id)}
                              title="Send email"
                            >
                              <i className="fas fa-envelope"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-info"
                              onClick={() => {
                                const details = `
Registration Details:
Name: ${registration.fullName}
Email: ${registration.email}
Phone: ${registration.phone}
Event: ${event ? event.title : 'Unknown'}
Tickets: ${registration.ticketQuantity}
Amount: ${registration.totalAmount > 0 ? `$${parseFloat(registration.totalAmount).toFixed(2)}` : 'Free'}
Status: ${registration.paymentStatus || 'Unknown'}
Code: ${registration.confirmationCode}
                                `;
                                alert(details);
                              }}
                              title="View details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-3">
                      No registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}