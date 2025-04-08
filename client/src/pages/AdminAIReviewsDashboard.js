// src/pages/AdminAIReviewsDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import API  from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define the colors
const colors = {
  primary: "#FF5A8E",
  secondary: "#0D1B40",
  accent: "#41C9E2",
  dark: "#081029",
  light: "#FFF5F8",
  text: "#0D1B40",
  textLight: "#6C7A9C",
  chart: ["#FF5A8E", "#0D1B40", "#41C9E2", "#FF9E6D", "#8676FF", "#44D7B6"]
};

// Loading spinner component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center my-4">
    <div className="spinner-border" role="status" style={{ color: colors.primary }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Error alert component
const ErrorAlert = ({ message }) => (
  <div className="container py-3">
    <div className="alert alert-danger" role="alert">
      <h4 className="alert-heading">Error Loading Data</h4>
      <p>{message || 'An unexpected error occurred. Please try again later.'}</p>
    </div>
  </div>
);

const AdminAIReviewsDashboard = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');
  const [sentimentTrend, setSentimentTrend] = useState([]);
  const [reviewVolume, setReviewVolume] = useState([]);
  const [eventReviews, setEventReviews] = useState([]);
  const [reportDate, setReportDate] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Function to fetch events from the API
  const fetchEvents = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/login');
        return;
      }

      const response = await API.get('https://ai-powered-event-production.up.railway.app/events', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Process event data to include additional metrics
      const processedEvents = await Promise.all(response.data.map(async (event) => {
        // Fetch reviews for this event
        const reviewsResponse = await API.get(`https://ai-powered-event-production.up.railway.app/events/${event.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const reviews = reviewsResponse.data.reviews || [];
        
        // Calculate metrics
        const reviewCount = reviews.length;
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;
        
        // Calculate sentiment score
        const positiveReviews = reviews.filter(review => review.sentiment === 'positive').length;
        const sentimentScore = reviewCount > 0 ? Math.round((positiveReviews / reviewCount) * 100) : 0;
        
        return {
          ...event,
          reviewCount,
          avgRating: parseFloat(avgRating),
          sentimentScore,
          attendanceTotal: Math.floor(Math.random() * 1000) + 200 // Placeholder for attendance data
        };
      }));

      setEvents(processedEvents);
      
      // Select the first event by default if available
      if (processedEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(processedEvents[0]);
        fetchEventAnalytics(processedEvents[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.error || 'Failed to load events');
      setLoading(false);
    }
  };

  // Function to fetch reviews for a specific event
  const fetchEventReviews = async (eventId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await API.get(`https://ai-powered-event-production.up.railway.app/events/${eventId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      setEventReviews(response.data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      // Set error state if needed, but don't disrupt the whole dashboard
    }
  };

  // Fetch event analytics based on time range
  const fetchEventAnalytics = async (eventId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/login');
        return;
      }

      // Calculate date range based on selected timeRange
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (timeRange === 'quarter') {
        startDate.setMonth(endDate.getMonth() - 3);
      }
      
      // Fetch reviews for this time period
      const response = await API.get(`https://ai-powered-event-production.up.railway.app/events/${eventId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const reviews = response.data.reviews || [];
      
      // Filter reviews by date range
      const filteredReviews = reviews.filter(review => {
        const reviewDate = new Date(review.createdAt);
        return reviewDate >= startDate && reviewDate <= endDate;
      });
      
      // Generate sentiment trend data
      const dateMap = new Map();
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dateMap.set(dateStr, { date: dateStr, score: 0, count: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Calculate sentiments by date
      filteredReviews.forEach(review => {
        const dateStr = new Date(review.createdAt).toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
          const dateData = dateMap.get(dateStr);
          
          // Update sentiment score (positive = 100, neutral = 50, negative = 0)
          const sentimentValue = 
            review.sentiment === 'positive' ? 100 :
            review.sentiment === 'neutral' ? 50 : 0;
          
          dateData.score = dateData.count > 0 
            ? (dateData.score * dateData.count + sentimentValue) / (dateData.count + 1)
            : sentimentValue;
            
          dateData.count += 1;
        }
      });
      
      // Convert to arrays for chart data
      const sentimentData = Array.from(dateMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(item => ({ 
          date: item.date, 
          score: item.count > 0 ? Math.round(item.score) : null 
        }));
        
      const volumeData = Array.from(dateMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(item => ({ 
          date: item.date, 
          count: item.count 
        }));
      
      // Fill in missing values with interpolation
      let lastValidScore = null;
      for (let i = 0; i < sentimentData.length; i++) {
        if (sentimentData[i].score !== null) {
          lastValidScore = sentimentData[i].score;
        } else if (lastValidScore !== null) {
          sentimentData[i].score = lastValidScore;
        } else {
          sentimentData[i].score = 70; // Default starting value
        }
      }

      setSentimentTrend(sentimentData);
      setReviewVolume(volumeData);
      
      // Also update the reviews for this event
      setEventReviews(reviews);
      
    } catch (err) {
      console.error('Error fetching event analytics:', err);
      // Generate some default data if the API fails
      generateDemoData();
    }
  };

  // Generate mock data for demos or when API calls fail
  const generateDemoData = () => {
    // Create mock sentiment data
    const daysInRange = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const sentimentData = [];
    const volumeData = [];
    
    for (let i = 0; i < daysInRange; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysInRange - i - 1));
      
      sentimentData.push({
        date: date.toISOString().split('T')[0],
        score: Math.floor(Math.random() * 30) + 70 // Random score between 70-100
      });
      
      volumeData.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1 // Random count between 1-10
      });
    }
    
    setSentimentTrend(sentimentData);
    setReviewVolume(volumeData);
  };

  // Handle admin response to review
  const handleAdminResponse = async (reviewId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/login');
        return;
      }
      
      // Generate AI response (in a real application, this would use an AI service)
      const aiResponse = "Thank you for your feedback! We appreciate your input and will use it to improve our future events.";
      
      // Send response to the API
      await axios.put(`https://ai-powered-event-production.up.railway.app/reviews/respond/${reviewId}`, 
        { adminResponse: aiResponse },
        { headers: { Authorization: `Bearer ${accessToken}` }}
      );
      
      // Update reviews with the response
      setEventReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId 
            ? { ...review, admin_response: aiResponse } 
            : review
        )
      );
      
      alert("AI response has been added successfully!");
    } catch (err) {
      console.error('Error sending AI response:', err);
      alert("Failed to add AI response. Please try again.");
    }
  };

  // Initialize with real data
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data when time range changes
  useEffect(() => {
    if (selectedEvent) {
      fetchEventAnalytics(selectedEvent.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedEvent]);

  // Handle event selection
  const selectEvent = (event) => {
    setSelectedEvent(event);
    fetchEventAnalytics(event.id);
    fetchEventReviews(event.id);
  };

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    // Fetch reviews when switching to the reviews tab
    if (tabId === 'reviews' && selectedEvent) {
      fetchEventReviews(selectedEvent.id);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

// Export report function
const exportReport = (format) => {
  if (!selectedEvent) return;
  
  // Get the report type from the dropdown
  const reportTypeSelect = document.querySelector('select.form-select');
  const reportType = reportTypeSelect ? reportTypeSelect.value : 'full';
  
  // Filter reviews by selected date range
  const startDate = new Date(reportDate.startDate);
  const endDate = new Date(reportDate.endDate);
  endDate.setHours(23, 59, 59, 999); // Set to end of day
  
  const filteredReviews = eventReviews.filter(review => {
    const reviewDate = new Date(review.createdAt);
    return reviewDate >= startDate && reviewDate <= endDate;
  });
  
  let csvContent = '';
  let filename = `${selectedEvent.title.replace(/\s+/g, '_')}_${reportType}_report_${new Date().toISOString().split('T')[0]}`;
  
  // Generate CSV header and content based on report type
  if (reportType === 'full' || reportType === 'comments') {
    csvContent = 'User,Review,Rating,Sentiment,Date,Response\n';
    
    filteredReviews.forEach(review => {
      // Escape quotes and commas in text fields
      const username = (review.username || 'Anonymous').replace(/"/g, '""');
      const reviewText = (review.review_text || '').replace(/"/g, '""');
      const adminResponse = (review.admin_response || '').replace(/"/g, '""');
      
      csvContent += `"${username}","${reviewText}",${review.rating},"${review.sentiment || 'neutral'}","${new Date(review.createdAt).toISOString().split('T')[0]}","${adminResponse}"\n`;
    });
  } 
  else if (reportType === 'sentiment') {
    // Calculate sentiment statistics
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    
    filteredReviews.forEach(review => {
      if (review.sentiment) {
        sentimentCounts[review.sentiment] += 1;
      } else {
        sentimentCounts.neutral += 1;
      }
    });
    
    const totalReviews = filteredReviews.length || 1; // Avoid division by zero
    
    csvContent = 'Sentiment,Count,Percentage\n';
    csvContent += `"Positive",${sentimentCounts.positive},${Math.round((sentimentCounts.positive / totalReviews) * 100)}%\n`;
    csvContent += `"Neutral",${sentimentCounts.neutral},${Math.round((sentimentCounts.neutral / totalReviews) * 100)}%\n`;
    csvContent += `"Negative",${sentimentCounts.negative},${Math.round((sentimentCounts.negative / totalReviews) * 100)}%\n`;
  }
  else if (reportType === 'ratings') {
    // Calculate rating statistics
    const ratingCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    
    filteredReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating.toString()] += 1;
      }
    });
    
    csvContent = 'Rating,Count\n';
    csvContent += `"1 Star",${ratingCounts['1']}\n`;
    csvContent += `"2 Stars",${ratingCounts['2']}\n`;
    csvContent += `"3 Stars",${ratingCounts['3']}\n`;
    csvContent += `"4 Stars",${ratingCounts['4']}\n`;
    csvContent += `"5 Stars",${ratingCounts['5']}\n`;
  }
  
  // Handle different export formats
  if (format === 'csv') {
    // Create a blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link and trigger click
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } 
  else if (format === 'json') {
    // Create JSON data based on report type
    let jsonData;
    
    if (reportType === 'full' || reportType === 'comments') {
      jsonData = filteredReviews.map(review => ({
        username: review.username || 'Anonymous',
        review_text: review.review_text || '',
        rating: review.rating,
        sentiment: review.sentiment || 'neutral',
        date: new Date(review.createdAt).toISOString().split('T')[0],
        admin_response: review.admin_response || ''
      }));
    } 
    else if (reportType === 'sentiment') {
      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      
      filteredReviews.forEach(review => {
        if (review.sentiment) {
          sentimentCounts[review.sentiment] += 1;
        } else {
          sentimentCounts.neutral += 1;
        }
      });
      
      const totalReviews = filteredReviews.length || 1;
      
      jsonData = [
        { sentiment: 'Positive', count: sentimentCounts.positive, percentage: Math.round((sentimentCounts.positive / totalReviews) * 100) },
        { sentiment: 'Neutral', count: sentimentCounts.neutral, percentage: Math.round((sentimentCounts.neutral / totalReviews) * 100) },
        { sentiment: 'Negative', count: sentimentCounts.negative, percentage: Math.round((sentimentCounts.negative / totalReviews) * 100) }
      ];
    }
    else if (reportType === 'ratings') {
      const ratingCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      
      filteredReviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          ratingCounts[review.rating.toString()] += 1;
        }
      });
      
      jsonData = [
        { rating: '1 Star', count: ratingCounts['1'] },
        { rating: '2 Stars', count: ratingCounts['2'] },
        { rating: '3 Stars', count: ratingCounts['3'] },
        { rating: '4 Stars', count: ratingCounts['4'] },
        { rating: '5 Stars', count: ratingCounts['5'] }
      ];
    }
    
    // Create a blob with the JSON content
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    
    // Create download link and trigger click
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  else {
    alert(`Export to ${format} format is not currently supported.`);
  }
};

  // Render overview tab
  const renderOverviewTab = () => {
    if (!selectedEvent) return null;

    // Prepare chart data for sentiment trend
    const sentimentChartData = {
      labels: sentimentTrend.map(item => item.date),
      datasets: [
        {
          label: 'Sentiment Score',
          data: sentimentTrend.map(item => item.score),
          borderColor: colors.primary,
          backgroundColor: `rgba(255, 90, 142, 0.1)`,
          tension: 0.4,
          fill: true
        }
      ]
    };

    // Prepare chart data for review volume
    const volumeChartData = {
      labels: reviewVolume.map(item => item.date),
      datasets: [
        {
          label: 'Review Count',
          data: reviewVolume.map(item => item.count),
          backgroundColor: colors.accent,
          borderRadius: 4
        }
      ]
    };

    // Chart options
    const lineOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    };

    const barOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };

    return (
      <div className="tab-pane fade show active">
        <h4 className="mb-4" style={{ color: colors.secondary }}>
          Overview Dashboard for {selectedEvent.title}
        </h4>
        
        {/* Key Metrics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="p-3 rounded text-center h-100 shadow-sm" 
                 style={{ backgroundColor: `rgba(255, 90, 142, 0.1)` }}>
              <div style={{ color: colors.primary, fontSize: '2rem', fontWeight: '700' }}>
                {selectedEvent.avgRating}
              </div>
              <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}>
                Overall Rating
              </div>
              <div style={{ color: colors.primary }} aria-hidden="true">
                {"★".repeat(Math.round(selectedEvent.avgRating || 0))}
              </div>
            </div>
          </div>
          
          <div className="col-md-3 col-sm-6">
            <div className="p-3 rounded text-center h-100 shadow-sm" 
                 style={{ backgroundColor: `rgba(13, 27, 64, 0.1)` }}>
              <div style={{ color: colors.secondary, fontSize: '2rem', fontWeight: '700' }}>
                {selectedEvent.reviewCount}
              </div>
              <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}>
                Total Reviews
              </div>
            </div>
          </div>
          
          <div className="col-md-3 col-sm-6">
            <div className="p-3 rounded text-center h-100 shadow-sm" 
                 style={{ backgroundColor: `rgba(65, 201, 226, 0.1)` }}>
              <div style={{ color: colors.accent, fontSize: '2rem', fontWeight: '700' }}>
                {selectedEvent.sentimentScore}%
              </div>
              <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}>
                Positive Sentiment
              </div>
            </div>
          </div>
          
          <div className="col-md-3 col-sm-6">
            <div className="p-3 rounded text-center h-100 shadow-sm" 
                 style={{ backgroundColor: 'rgba(255, 158, 109, 0.1)' }}>
              <div style={{ color: '#FF9E6D', fontSize: '2rem', fontWeight: '700' }}>
                {selectedEvent.attendanceTotal?.toLocaleString() || 0}
              </div>
              <div style={{ color: colors.secondary, fontSize: '0.9rem', fontWeight: '500' }}>
                Total Attendance
              </div>
            </div>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="d-flex justify-content-end mb-3">
          <div className="btn-group">
            <button 
              className={`btn btn-sm ${timeRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleTimeRangeChange('week')}
              style={{ 
                backgroundColor: timeRange === 'week' ? colors.primary : 'white',
                borderColor: colors.primary,
                color: timeRange === 'week' ? 'white' : colors.primary
              }}
            >
              Week
            </button>
            <button 
              className={`btn btn-sm ${timeRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleTimeRangeChange('month')}
              style={{ 
                backgroundColor: timeRange === 'month' ? colors.primary : 'white',
                borderColor: colors.primary,
                color: timeRange === 'month' ? 'white' : colors.primary
              }}
            >
              Month
            </button>
            <button 
              className={`btn btn-sm ${timeRange === 'quarter' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleTimeRangeChange('quarter')}
              style={{ 
                backgroundColor: timeRange === 'quarter' ? colors.primary : 'white',
                borderColor: colors.primary,
                color: timeRange === 'quarter' ? 'white' : colors.primary
              }}
            >
              Quarter
            </button>
          </div>
        </div>
        
        {/* Charts Row */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Sentiment Trend</h5>
              </div>
              <div className="card-body">
                <Line data={sentimentChartData} options={lineOptions} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Review Volume</h5>
              </div>
              <div className="card-body">
                <Bar data={volumeChartData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render reviews tab
  const renderReviewsTab = () => {
    if (!selectedEvent) return null;

    return (
      <div className="tab-pane fade show active">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 style={{ color: colors.secondary }}>
            Reviews for {selectedEvent.title}
          </h4>
          <button 
            className="btn btn-sm"
            style={{ backgroundColor: colors.primary, color: 'white' }}
            onClick={() => {
              // Auto-respond to all unresponded reviews
              eventReviews.forEach(review => {
                if (!review.admin_response) {
                  handleAdminResponse(review.id);
                }
              });
            }}
          >
            Auto-respond to All
          </button>
        </div>
        
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: colors.light }}>
                  <tr>
                    <th style={{ color: colors.secondary }}>User</th>
                    <th style={{ color: colors.secondary }}>Review</th>
                    <th style={{ color: colors.secondary }}>Rating</th>
                    <th style={{ color: colors.secondary }}>Sentiment</th>
                    <th style={{ color: colors.secondary }}>Date</th>
                    <th style={{ color: colors.secondary }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eventReviews.length > 0 ? (
                    eventReviews.map((review) => (
                      <tr key={review.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div 
                              className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                              style={{ 
                                width: '30px', 
                                height: '30px', 
                                backgroundColor: colors.primary, 
                                color: 'white' 
                              }}
                            >
                              {review.username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <span>{review.username || 'Anonymous'}</span>
                          </div>
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {review.review_text}
                          </div>
                          {review.admin_response && (
                            <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                              Responded
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ color: colors.primary }}>
                            {review.rating} {"★".repeat(review.rating)}
                          </span>
                        </td>
                        <td>
                          <span 
                            className={`badge ${
                              review.sentiment === 'positive' 
                                ? 'bg-success' 
                                : review.sentiment === 'negative' 
                                  ? 'bg-danger' 
                                  : 'bg-secondary'
                            }`}
                          >
                            {review.sentiment || 'neutral'}
                          </span>
                        </td>
                        <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm"
                              style={{ 
                                backgroundColor: review.admin_response ? '#6c757d' : colors.accent, 
                                color: 'white'
                              }}
                              onClick={() => handleAdminResponse(review.id)}
                              disabled={!!review.admin_response}
                            >
                              {review.admin_response ? 'Responded' : 'AI Response'}
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => alert(`View details for review #${review.id}`)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <p style={{ color: colors.secondary }}>No reviews found for this event.</p>
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
  };

  // Render reports tab
  const renderReportsTab = () => {
    if (!selectedEvent) return null;

    // Calculate sentiment distribution from reviews
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const ratingCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    
    eventReviews.forEach(review => {
      // Count sentiments
      if (review.sentiment) {
        sentimentCounts[review.sentiment] += 1;
      } else {
        sentimentCounts.neutral += 1;
      }
      
      // Count ratings
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating.toString()] += 1;
      }
    });
    
    // Calculate percentages
    const totalReviews = eventReviews.length || 1; // Avoid division by zero
    const sentimentData = {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [
          Math.round((sentimentCounts.positive / totalReviews) * 100),
          Math.round((sentimentCounts.neutral / totalReviews) * 100),
          Math.round((sentimentCounts.negative / totalReviews) * 100)
        ],
        backgroundColor: [colors.chart[0], colors.chart[2], colors.chart[4]]
      }]
    };

    const ratingData = {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [{
        data: [
          ratingCounts['1'],
          ratingCounts['2'],
          ratingCounts['3'],
          ratingCounts['4'],
          ratingCounts['5']
        ],
        backgroundColor: colors.chart
      }]
    };

    // Chart options
    const pieOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'right' }
      }
    };

    const barOptions = {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };

    return (
      <div className="tab-pane fade show active">
        <h4 className="mb-4" style={{ color: colors.secondary }}>
          Analytics Reports for {selectedEvent.title}
        </h4>
        
        {/* Charts Row */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Sentiment Distribution</h5>
              </div>
              <div className="card-body">
                <Pie data={sentimentData} options={pieOptions} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Rating Distribution</h5>
              </div>
              <div className="card-body">
                <Bar data={ratingData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Export Options */}
        <div className="card shadow-sm">
          <div className="card-header" style={{ backgroundColor: colors.light }}>
            <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Export Reports</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Report Type</label>
                  <select className="form-select" defaultValue="full">
                    <option value="full">Complete Analytics Report</option>
                    <option value="sentiment">Sentiment Analysis</option>
                    <option value="ratings">Ratings Distribution</option>
                    <option value="comments">Review Comments</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Format</label>
                  <select className="form-select" id="exportFormat" defaultValue="csv">
                    <option value="csv">CSV File</option>
                    <option value="json">JSON Data</option>
                    <option value="pdf" disabled>PDF Document (Coming Soon)</option>
                    <option value="excel" disabled>Excel Spreadsheet (Coming Soon)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Date Range</label>
              <div className="row">
                <div className="col-md-6">
                  <input 
                    type="date" 
                    className="form-control" 
                    placeholder="Start Date" 
                    value={reportDate.startDate}
                    onChange={(e) => setReportDate({...reportDate, startDate: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <input 
                    type="date" 
                    className="form-control" 
                    placeholder="End Date" 
                    value={reportDate.endDate}
                    onChange={(e) => setReportDate({...reportDate, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="d-flex">
              <button 
                className="btn me-2"
                style={{ backgroundColor: colors.primary, color: 'white' }}
                onClick={() => exportReport(document.getElementById('exportFormat').value)}
              >
                Generate Report
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => alert("Weekly report scheduling feature coming soon!")}
              >
                Schedule Weekly Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render function
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  // Updated background and header styles
const backgroundStyle = {
  background: `linear-gradient(135deg, 
    ${colors.light} 0%, 
    ${colors.accent}10 50%, 
    ${colors.primary}10 100%)`,
  minHeight: '100vh',
  paddingTop: '2rem',
  paddingBottom: '2rem'
};

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
            Analytics Dashboard
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
            Transforming event feedback into actionable insights
          </p>
        </div>
      </div>
      </div>

      <div className="row">
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-header" style={{ backgroundColor: colors.light }}>
              <h5 className="card-title mb-0" style={{ color: colors.secondary }}>Events</h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {events.length > 0 ? (
                  events.map((event) => (
                    <button
                      key={event.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        selectedEvent && selectedEvent.id === event.id ? 'active' : ''
                      }`}
                      style={{
                        backgroundColor: selectedEvent && selectedEvent.id === event.id ? colors.primary : 'white',
                        color: selectedEvent && selectedEvent.id === event.id ? 'white' : colors.text
                      }}
                      onClick={() => selectEvent(event)}
                    >
                      <div>
                        <div style={{ fontWeight: '500' }}>{event.title}</div>
                        <small style={{ opacity: 0.8 }}>{new Date(event.date).toLocaleDateString()}</small>
                      </div>
                      <span 
                        className={`badge rounded-pill ${selectedEvent && selectedEvent.id === event.id ? 'bg-white text-primary' : 'bg-primary text-white'}`}
                      >
                        {event.reviewCount}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No events available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="card-footer" style={{ backgroundColor: colors.light }}>
              <button 
                className="btn btn-sm"
                style={{ backgroundColor: colors.primary, color: 'white' }}
                onClick={() => navigate('/create_event')}
              >
                <i className="bi bi-plus-circle me-1"></i> Add Event
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          {selectedEvent ? (
            <div className="card shadow-sm">
              <div className="card-header" style={{ backgroundColor: colors.light }}>
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                      style={{
                        color: activeTab === 'overview' ? colors.primary : colors.textLight,
                        fontWeight: activeTab === 'overview' ? '500' : '400'
                      }}
                      onClick={() => handleTabChange('overview')}
                    >
                      Overview
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                      style={{
                        color: activeTab === 'reviews' ? colors.primary : colors.textLight,
                        fontWeight: activeTab === 'reviews' ? '500' : '400'
                      }}
                      onClick={() => handleTabChange('reviews')}
                    >
                      Reviews
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                      style={{
                        color: activeTab === 'reports' ? colors.primary : colors.textLight,
                        fontWeight: activeTab === 'reports' ? '500' : '400'
                      }}
                      onClick={() => handleTabChange('reports')}
                    >
                      Reports
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'reviews' && renderReviewsTab()}
                {activeTab === 'reports' && renderReportsTab()}
              </div>
            </div>
          ) : (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <p className="text-muted mb-4">Select an event to view analytics</p>
                <button 
                  className="btn"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                  onClick={() => navigate('/create-event')}
                >
                  <i className="bi bi-plus-circle me-1"></i> Add Your First Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAIReviewsDashboard;