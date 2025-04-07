// src/services/EventService.js
import axios from 'axios';

// Base URL for API endpoints
const API_BASE_URL = 'https://ai-powered-event-production.up.railway.app';

// Helper function to get the auth header with token
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

/**
 * Event Service - Handles all API calls related to events and reviews
 */
const EventService = {
  /**
   * Fetch all events
   * @returns {Promise} Promise with events data
   */
  getAllEvents: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  /**
   * Get a specific event by ID including its reviews
   * @param {number} eventId - Event ID
   * @returns {Promise} Promise with event data and reviews
   */
  getEventById: async (eventId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events/${eventId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching event #${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new event
   * @param {Object} eventData - Event details
   * @returns {Promise} Promise with created event data
   */
  createEvent: async (eventData) => {
    try {
      const formData = new FormData();
      
      // Add all event fields to the form data
      Object.keys(eventData).forEach(key => {
        if (key === 'image' && eventData[key] instanceof File) {
          formData.append(key, eventData[key]);
        } else if (key !== 'image') {
          formData.append(key, eventData[key]);
        }
      });
      
      const response = await axios.post(`${API_BASE_URL}/events`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  /**
   * Update an existing event
   * @param {number} eventId - Event ID
   * @param {Object} eventData - Updated event details
   * @returns {Promise} Promise with updated event data
   */
  updateEvent: async (eventId, eventData) => {
    try {
      const formData = new FormData();
      
      // Add all event fields to the form data
      Object.keys(eventData).forEach(key => {
        if (key === 'image' && eventData[key] instanceof File) {
          formData.append(key, eventData[key]);
        } else if (key !== 'image') {
          formData.append(key, eventData[key]);
        }
      });
      
      const response = await axios.put(`${API_BASE_URL}/events/${eventId}`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating event #${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an event
   * @param {number} eventId - Event ID
   * @returns {Promise} Promise with success message
   */
  deleteEvent: async (eventId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/events/${eventId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting event #${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Add a review to an event
   * @param {Object} reviewData - Review details
   * @returns {Promise} Promise with created review data
   */
  addReview: async (reviewData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reviews`, reviewData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  /**
   * Delete a review
   * @param {number} reviewId - Review ID
   * @returns {Promise} Promise with success message
   */
  deleteReview: async (reviewId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting review #${reviewId}:`, error);
      throw error;
    }
  },

  /**
   * Add an admin response to a review
   * @param {number} reviewId - Review ID
   * @param {string} adminResponse - Admin response text
   * @returns {Promise} Promise with updated review data
   */
  respondToReview: async (reviewId, adminResponse) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/reviews/respond/${reviewId}`, 
        { adminResponse },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error responding to review #${reviewId}:`, error);
      throw error;
    }
  },

  /**
   * Auto-generate an AI response for a review
   * @param {number} reviewId - Review ID
   * @returns {Promise} Promise with AI-generated response
   */
  generateAIResponse: async (reviewId) => {
    try {
      // For now, we'll just return a generic response
      // In a real application, this would call an AI service
      const aiResponse = "Thank you for your feedback! We appreciate your insights and will use them to improve our future events.";
      
      // Send the AI-generated response to the review
      return await EventService.respondToReview(reviewId, aiResponse);
    } catch (error) {
      console.error(`Error generating AI response for review #${reviewId}:`, error);
      throw error;
    }
  },

  /**
   * Get analytics data for an event
   * @param {number} eventId - Event ID
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise} Promise with analytics data
   */
  getEventAnalytics: async (eventId, startDate, endDate) => {
    try {
      // First, get the event with all its reviews
      const eventData = await EventService.getEventById(eventId);
      
      // Filter reviews by date if dates are provided
      let filteredReviews = eventData.reviews;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of day
        
        filteredReviews = eventData.reviews.filter(review => {
          const reviewDate = new Date(review.createdAt);
          return reviewDate >= start && reviewDate <= end;
        });
      }
      
      // Calculate analytics
      const totalReviews = filteredReviews.length;
      const ratings = {
        average: 0,
        distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
      };
      const sentiment = {
        positive: 0,
        neutral: 0,
        negative: 0
      };
      
      // Process reviews
      if (totalReviews > 0) {
        let ratingSum = 0;
        
        filteredReviews.forEach(review => {
          // Count rating
          const rating = review.rating;
          ratingSum += rating;
          if (rating >= 1 && rating <= 5) {
            ratings.distribution[rating]++;
          }
          
          // Count sentiment
          if (review.sentiment) {
            sentiment[review.sentiment]++;
          } else {
            sentiment.neutral++;
          }
        });
        
        ratings.average = (ratingSum / totalReviews).toFixed(1);
      }
      
      // Create time series data for charts
      const timeSeriesData = EventService.generateTimeSeriesData(
        filteredReviews,
        startDate || new Date(Math.min(...filteredReviews.map(r => new Date(r.createdAt)))).toISOString().split('T')[0],
        endDate || new Date().toISOString().split('T')[0]
      );
      
      return {
        event: eventData.event,
        analytics: {
          totalReviews,
          ratings,
          sentiment,
          timeSeries: timeSeriesData
        }
      };
    } catch (error) {
      console.error(`Error fetching analytics for event #${eventId}:`, error);
      throw error;
    }
  },
  
  /**
   * Generate time series data for charts
   * @param {Array} reviews - Array of review objects
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Object} Object with time series data
   */
  generateTimeSeriesData: (reviews, startDate, endDate) => {
    // Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Create an array of all dates in the range
    const dates = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    // Initialize data structure with zeros
    const sentimentData = {};
    const volumeData = {};
    
    dates.forEach(date => {
      sentimentData[date] = {
        positive: 0,
        neutral: 0,
        negative: 0,
        score: 0
      };
      volumeData[date] = 0;
    });
    
    // Fill in data from reviews
    reviews.forEach(review => {
      const reviewDate = new Date(review.createdAt).toISOString().split('T')[0];
      
      // Only process if date is in our range
      if (sentimentData[reviewDate]) {
        // Count by sentiment
        if (review.sentiment) {
          sentimentData[reviewDate][review.sentiment]++;
        } else {
          sentimentData[reviewDate].neutral++;
        }
        
        // Increment volume
        volumeData[reviewDate]++;
      }
    });
    
    // Calculate sentiment scores for each day (% positive)
    Object.keys(sentimentData).forEach(date => {
      const data = sentimentData[date];
      const total = data.positive + data.neutral + data.negative;
      
      if (total > 0) {
        // Calculate weighted score: 100 for positive, 50 for neutral, 0 for negative
        const weightedScore = (
          (data.positive * 100) + 
          (data.neutral * 50) + 
          (data.negative * 0)
        ) / total;
        
        sentimentData[date].score = Math.round(weightedScore);
      } else {
        // No reviews that day
        sentimentData[date].score = null;
      }
    });
    
    // Convert to format needed for charts
    const sentimentSeries = dates.map(date => ({
      date,
      score: sentimentData[date].score
    }));
    
    const volumeSeries = dates.map(date => ({
      date,
      count: volumeData[date]
    }));
    
    // Fill missing sentiment scores with interpolation
    let lastValidScore = null;
    let defaultScore = 70; // Default score if no earlier value exists
    
    for (let i = 0; i < sentimentSeries.length; i++) {
      if (sentimentSeries[i].score !== null) {
        lastValidScore = sentimentSeries[i].score;
      } else if (lastValidScore !== null) {
        sentimentSeries[i].score = lastValidScore;
      } else {
        // Look ahead for the next valid score
        let nextValidScore = null;
        for (let j = i + 1; j < sentimentSeries.length; j++) {
          if (sentimentSeries[j].score !== null) {
            nextValidScore = sentimentSeries[j].score;
            break;
          }
        }
        
        sentimentSeries[i].score = nextValidScore !== null ? nextValidScore : defaultScore;
      }
    }
    
    return {
      sentiment: sentimentSeries,
      volume: volumeSeries
    };
  }
};

export default EventService;