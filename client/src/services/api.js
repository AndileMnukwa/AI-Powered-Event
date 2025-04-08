// src/services/api.js
import axios from 'axios';

// Create axios instance with defaults
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://ai-powered-event-production.up.railway.app',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
API.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API service for AI Reviews
export const AIReviewsAPI = {
  // Get all events with basic info
  getEvents: async () => {
    try {
      const response = await API.get('/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get event details with reviews
  getEventDetails: async (eventId) => {
    try {
      const response = await API.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event details for ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get reviews for an event
  getEventReviews: async (eventId) => {
    try {
      const response = await API.get(`/reviews/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching reviews for event ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get AI sentiment analysis for event reviews
  getEventSentiment: async (eventId) => {
    try {
      const response = await API.get(`/reviews/sentiment/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sentiment analysis for event ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get attendance analytics for an event (mock function - needs backend implementation)
  getAttendanceData: async (eventId) => {
    try {
      // This would be an actual API call in production
      // For now, we'll generate random attendance data
      // In a real implementation, this would be stored in your MySQL database
      return [
        { day: 'Day 1', attendance: Math.floor(Math.random() * 1000) + 500 },
        { day: 'Day 2', attendance: Math.floor(Math.random() * 1000) + 500 },
        { day: 'Day 3', attendance: Math.floor(Math.random() * 1000) + 500 }
      ];
    } catch (error) {
      console.error(`Error fetching attendance data for event ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get satisfaction distribution for an event (mock function - needs backend implementation)
  getSatisfactionData: async (eventId) => {
    try {
      // This would be an actual API call in production
      return [
        { name: 'Very Satisfied', value: 65 },
        { name: 'Satisfied', value: 25 },
        { name: 'Neutral', value: 7 },
        { name: 'Dissatisfied', value: 3 }
      ];
    } catch (error) {
      console.error(`Error fetching satisfaction data for event ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get rating breakdown for an event (mock function - needs backend implementation)
  getRatingBreakdown: async (eventId) => {
    try {
      // This would be an actual API call in production
      return [
        { category: 'Content', rating: 4.8 },
        { category: 'Speakers', rating: 4.7 },
        { category: 'Venue', rating: 4.6 },
        { category: 'Organization', rating: 4.5 },
        { category: 'Value', rating: 4.7 }
      ];
    } catch (error) {
      console.error(`Error fetching rating breakdown for event ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get engagement timeline for an event (mock function - needs backend implementation)
  getEngagementData: async (eventId) => {
    try {
      // This would be an actual API call in production
      return [
        { time: '9 AM', engagement: 70 },
        { time: '10 AM', engagement: 82 },
        { time: '11 AM', engagement: 93 },
        { time: '12 PM', engagement: 65 },
        { time: '1 PM', engagement: 75 },
        { time: '2 PM', engagement: 85 },
        { time: '3 PM', engagement: 90 },
        { time: '4 PM', engagement: 88 },
        { time: '5 PM', engagement: 72 }
      ];
    } catch (error) {
      console.error(`Error fetching engagement data for event ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get AI insights for an event (mock function - needs backend implementation)
  getAIInsights: async (eventId, category) => {
    try {
      // This would be an actual API call in production
      return [
        `Attendees showed highest engagement during sessions on ${category}`,
        `${Math.floor(Math.random() * 20) + 80}% of attendees rated the networking opportunities as 'excellent' or 'very good'`,
        `Most frequently mentioned keywords in positive reviews: 'organization', 'content', 'speakers'`,
        `Suggestion for improvement: More interactive activities based on feedback analysis`
      ];
    } catch (error) {
      console.error(`Error fetching AI insights for event ID ${eventId}:`, error);
      throw error;
    }
  }
};

export default API;