import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../helpers/AuthContext';
import {
  FaCalendarAlt, FaImage, FaMapMarkerAlt, FaArrowLeft,
  FaSave, FaTimes, FaInfoCircle, FaCheck,
  FaHeart, FaClock, FaTags, FaEdit, FaDollarSign,
  FaTicketAlt, FaCalendarCheck, FaUsers, FaUserPlus
} from 'react-icons/fa';
import API from '../services/api';

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentImage, setCurrentImage] = useState('');

  // New fields for paid events
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [ticketsAvailable, setTicketsAvailable] = useState(100);
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [maxRegistrations, setMaxRegistrations] = useState('');
  const [minRegistrations, setMinRegistrations] = useState(1);
  const [status, setStatus] = useState('active');

  // Options for category dropdown
  const categoryOptions = [
    'Conference', 'Workshop', 'Seminar', 'Networking',
    'Social Gathering', 'Corporate Event', 'Trade Show',
    'Charity', 'Festival', 'Concert', 'Sports', 'Other'
  ];

  // Options for status dropdown
  const statusOptions = [
    'active', 'cancelled', 'completed', 'draft'
  ];

  // Custom color constants
  const colors = {
    navy: "#001F3F",
    coral: "#FF6B6B",
    white: "#FFFFFF",
    lightGray: "#F5F7FA",
    gray: "#E2E8F0",
    darkGray: "#718096",
    errorRed: "#FF4D6A",
    successGreen: "#2DD4BF"
  };

  useEffect(() => {
    // Check authentication
    if (!authState.status || !authState.isAdmin) {
      navigate("/login");
      return;
    }

    const fetchEventData = async () => {
      setLoading(true);
      try {
        const response = await API.get(`https://ai-powered-event-production.up.railway.app/events/${id}`);
        const eventData = response.data.event;

        if (!eventData) {
          setError('Event not found');
          return;
        }

        // Set form fields with existing data
        setTitle(eventData.title);
        setLocation(eventData.location);
        setDescription(eventData.description);
        setDate(formatDateForInput(eventData.date));
        setTime(eventData.time);
        setCategory(eventData.category);

        // Set fields for paid events
        setIsPaid(eventData.isPaid || false);
        setPrice(eventData.price || 0);
        setTicketsAvailable(eventData.ticketsAvailable || 100);

        if (eventData.registrationDeadline) {
          setRegistrationDeadline(formatDateForInput(eventData.registrationDeadline));
        }

        setMaxRegistrations(eventData.maxRegistrations || '');
        setMinRegistrations(eventData.minRegistrations || 1);
        setStatus(eventData.status || 'active');

        if (eventData.image) {
          setCurrentImage(getImageUrl(eventData.image));
        }

      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, authState, navigate]);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Function to correct the image path
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http')) return imagePath;

    if (imagePath.startsWith('/uploads/events/')) {
      return `https://ai-powered-event-production.up.railway.app${imagePath}`;
    }

    return `https://ai-powered-event-production.up.railway.app/${imagePath}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!title.trim()) return 'Title is required';
    if (!location.trim()) return 'Location is required';
    if (!description.trim()) return 'Description is required';
    if (!date) return 'Date is required';
    if (!time) return 'Time is required';
    if (!category) return 'Category is required';
    if (!status) return 'Status is required';
    if (isPaid && (price <= 0)) return 'Price must be greater than 0 for paid events';
    if (ticketsAvailable < 1) return 'Tickets available must be at least 1';
    if (minRegistrations < 1) return 'Minimum registrations must be at least 1';
    if (maxRegistrations && maxRegistrations < minRegistrations) {
      return 'Maximum registrations cannot be less than minimum registrations';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setError('Authorization required. Please log in again.');
        setLoading(false);
        return;
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('location', location);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('category', category);
      formData.append('status', status);

      // Add fields for paid events
      formData.append('isPaid', isPaid);
      formData.append('price', isPaid ? price : 0);
      formData.append('ticketsAvailable', ticketsAvailable);

      if (registrationDeadline) {
        formData.append('registrationDeadline', registrationDeadline);
      }

      if (maxRegistrations) {
        formData.append('maxRegistrations', maxRegistrations);
      }

      formData.append('minRegistrations', minRegistrations);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Update event with form data
      await API.put(`https://ai-powered-event-production.up.railway.app/events/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`
        }
      });

      setSuccessMsg('Event updated successfully!');

      // Scroll to top to show success message
      window.scrollTo(0, 0);

      // Navigate back to event page after a short delay
      setTimeout(() => {
        navigate(`/event/${id}`);
      }, 2000);

    } catch (err) {
      console.error('Error updating event:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update event. Please try again.';
      setError(errorMessage);
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    navigate(`/event/${id}`);
  };

  // Footer component
  const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
      <footer style={{
        backgroundColor: colors.navy,
        color: colors.white,
        padding: "1.5rem",
        textAlign: "center",
        width: "100%",
        boxShadow: "0 -5px 10px rgba(0,0,0,0.05)"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          <p style={{
            margin: "0.5rem 0",
            fontWeight: "600",
            fontSize: "1rem"
          }}>
            <FaHeart style={{ color: colors.coral, marginRight: "0.5rem" }} /> EventHub Community
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: colors.lightGray }}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: colors.lightGray }}>
            <button
              onClick={() => navigate("/terms")}
              style={{
                color: colors.coral,
                textDecoration: "none",
                fontWeight: "500",
                transition: "color 0.3s ease",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0
              }}
            >
              Terms
            </button> •
            <button
              onClick={() => navigate("/privacy")}
              style={{
                color: colors.coral,
                textDecoration: "none",
                fontWeight: "500",
                transition: "color 0.3s ease",
                background: "none",
                border: "none",
                cursor: "pointer",
                margin: "0 0.5rem",
                padding: 0
              }}
            >
              Privacy
            </button> •
            <button
              onClick={() => navigate("/support")}
              style={{
                color: colors.coral,
                textDecoration: "none",
                fontWeight: "500",
                transition: "color 0.3s ease",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0
              }}
            >
              Support
            </button>
          </p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: colors.lightGray }}>
            © {currentYear} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    );
  };

  if (loading && !title) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh", paddingTop: "70px" }}>
        <div className="spinner-border" role="status" style={{ color: colors.coral }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="container my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: colors.navy }}>
            <FaEdit className="me-2" style={{ color: colors.coral }} />
            Edit Event
          </h2>
          <button
            className="btn"
            onClick={cancelEdit}
            style={{
              backgroundColor: "transparent",
              borderColor: colors.navy,
              color: colors.navy
            }}
          >
            <FaArrowLeft className="me-2" />
            Back to Event
          </button>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <FaInfoCircle className="me-2" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <FaCheck className="me-2" />
            {successMsg}
          </div>
        )}

        <div className="card shadow-sm mb-4">
          <div className="card-header" style={{ backgroundColor: colors.navy, color: "white" }}>
            <div className="d-flex align-items-center">
              <FaCalendarAlt className="me-2" style={{ color: colors.coral }} />
              <span>Event Information</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="mb-3">
                <label htmlFor="title" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  Event Title*
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                />
              </div>

              {/* Location */}
              <div className="mb-3">
                <label htmlFor="location" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  <FaMapMarkerAlt className="me-2" style={{ color: colors.coral }} />
                  Location*
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                />
              </div>

              {/* Date and Time */}
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="date" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    <FaCalendarAlt className="me-2" style={{ color: colors.coral }} />
                    Date*
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{ borderColor: colors.gray }}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="time" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    <FaClock className="me-2" style={{ color: colors.coral }} />
                    Time*
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    style={{ borderColor: colors.gray }}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-3">
                <label htmlFor="category" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  <FaTags className="me-2" style={{ color: colors.coral }} />
                  Category*
                </label>
                <select
                  className="form-select"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="mb-3">
                <label htmlFor="status" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  <FaCalendarCheck className="me-2" style={{ color: colors.coral }} />
                  Status*
                </label>
                <select
                  className="form-select"
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                >
                  {statusOptions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label htmlFor="description" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  Description*
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{ borderColor: colors.gray }}
                />
              </div>

              {/* Paid Event Toggle */}
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isPaid"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="isPaid"
                    style={{ color: colors.navy, fontWeight: "500", cursor: "pointer" }}
                  >
                    <FaDollarSign className="me-2" style={{ color: colors.coral }} />
                    This is a paid event
                  </label>
                </div>
              </div>

              {/* Price - Show only if paid event is checked */}
              {isPaid && (
                <div className="mb-3">
                  <label htmlFor="price" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    Price*
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.01"
                      required={isPaid}
                      style={{ borderColor: colors.gray }}
                    />
                  </div>
                </div>
              )}

              {/* Ticket Information */}
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="ticketsAvailable" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    <FaTicketAlt className="me-2" style={{ color: colors.coral }} />
                    Available Tickets*
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="ticketsAvailable"
                    value={ticketsAvailable}
                    onChange={(e) => setTicketsAvailable(parseInt(e.target.value) || 0)}
                    min="1"
                    required
                    style={{ borderColor: colors.gray }}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="registrationDeadline" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    <FaCalendarCheck className="me-2" style={{ color: colors.coral }} />
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="registrationDeadline"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    style={{ borderColor: colors.gray }}
                  />
                </div>
              </div>

              {/* Min and Max Registration */}
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="minRegistrations" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    <FaUserPlus className="me-2" style={{ color: colors.coral }} />
                    Minimum Registrations*
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="minRegistrations"
                    value={minRegistrations}
                    onChange={(e) => setMinRegistrations(parseInt(e.target.value) || 1)}
                    min="1"
                    required
                    style={{ borderColor: colors.gray }}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="maxRegistrations" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                    <FaUsers className="me-2" style={{ color: colors.coral }} />
                    Maximum Registrations
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="maxRegistrations"
                    value={maxRegistrations}
                    onChange={(e) => setMaxRegistrations(e.target.value ? parseInt(e.target.value) : '')}
                    min={minRegistrations}
                    style={{ borderColor: colors.gray }}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <label htmlFor="image" className="form-label" style={{ color: colors.navy, fontWeight: "500" }}>
                  <FaImage className="me-2" style={{ color: colors.coral }} />
                  Event Image
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ borderColor: colors.gray }}
                />
                <div className="form-text" style={{ color: colors.darkGray }}>
                  Upload a new image to replace the current one, or leave empty to keep existing image.
                </div>

                {/* Image preview */}
                <div className="mt-3 d-flex gap-3 flex-wrap">
                  {currentImage && !imagePreview && (
                    <div>
                      <p className="mb-2" style={{ color: colors.navy }}>Current Image:</p>
                      <img
                        src={currentImage}
                        alt="Current event"
                        className="img-thumbnail"
                        style={{ maxHeight: "150px" }}
                      />
                    </div>
                  )}

                  {imagePreview && (
                    <div>
                      <p className="mb-2" style={{ color: colors.navy }}>New Image:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ maxHeight: "150px" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit and Cancel buttons */}
              <div className="d-flex justify-content-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn"
                  onClick={cancelEdit}
                  style={{
                    backgroundColor: colors.lightGray,
                    color: colors.navy
                  }}
                >
                  <FaTimes className="me-2" /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  style={{
                    backgroundColor: colors.navy,
                    color: colors.white
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default EditEvent;