"use client"

import { useContext, useEffect, useState } from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import { FaCalendarAlt, FaMapMarkerAlt, FaFileAlt, FaPlus, FaHeart, FaClock, FaTag, 
         FaImage, FaDollarSign, FaTicketAlt, FaCalendarCheck, FaUsers, FaUserPlus } from "react-icons/fa"
import { AuthContext } from "../helpers/AuthContext"
import API  from '../services/api'


function CreateEvent() {
  const { authState } = useContext(AuthContext)
  const navigate = useNavigate()
  const [currentDate] = useState(new Date().toISOString().split("T")[0])
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isHovered, setIsHovered] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  // Remove the unused state variable
  // const [isPaidEvent, setIsPaidEvent] = useState(false)

  const initialValues = {
    title: "",
    location: "",
    description: "",
    date: currentDate,
    time: "12:00", // Default time - noon
    category: "", // New field for category
    image: null, // New field for image
    // New fields for paid events
    isPaid: false,
    price: 0,
    ticketsAvailable: 100,
    registrationDeadline: "",
    maxRegistrations: "",
    minRegistrations: 1,
    status: "active"
  }

  useEffect(() => {
    if (!authState.status) {
      navigate("/login")
    }
  }, [authState, navigate])

  // Modify the validationSchema in CreateEvent.js
const validationSchema = Yup.object().shape({
  title: Yup.string().trim().required("Title is required"),
  location: Yup.string().trim().required("Location is required"),
  description: Yup.string().trim().required("Description is required"),
  date: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .required("Date is required"),
  time: Yup.string()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format")
    .required("Time is required"),
  category: Yup.string().trim().required("Category is required"),
  image: Yup.mixed(), // Optional field
  isPaid: Yup.boolean(),
  // Fix for the price field validation
  price: Yup.number().when('isPaid', {
    is: true,
    then: () => Yup.number().min(0.01, "Price must be greater than 0").required("Price is required for paid events"),
    otherwise: () => Yup.number().nullable()
  }),
  ticketsAvailable: Yup.number().integer("Must be a whole number").min(1, "Must have at least one ticket"),
  registrationDeadline: Yup.string().nullable(),
  maxRegistrations: Yup.number().integer("Must be a whole number").nullable(),
  minRegistrations: Yup.number().integer("Must be a whole number").min(1, "Minimum registrations must be at least 1"),
  status: Yup.string().required("Status is required")
});

  const onSubmit = async (data, { setSubmitting, resetForm }) => {
    setErrorMessage("")
    setSuccessMessage("")
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken) {
      setErrorMessage("Unauthorized. Please log in again.")
      setSubmitting(false)
      return
    }

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("location", data.location)
      formData.append("description", data.description)
      formData.append("date", data.date)
      formData.append("time", data.time)
      formData.append("category", data.category)

      // Add the new fields for paid events
      formData.append("isPaid", data.isPaid)
      formData.append("price", data.isPaid ? data.price : 0)
      formData.append("ticketsAvailable", data.ticketsAvailable)
      
      if (data.registrationDeadline) {
        formData.append("registrationDeadline", data.registrationDeadline)
      }
      
      if (data.maxRegistrations) {
        formData.append("maxRegistrations", data.maxRegistrations)
      }
      
      formData.append("minRegistrations", data.minRegistrations)
      formData.append("status", data.status)
      
      // Append image if it exists
      if (data.image) {
        formData.append("image", data.image)
      }

      // Create the event with FormData
      const response = await API.post("https://ai-powered-event-production.up.railway.app/events", formData, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        },
      })

      const eventId = response.data.id

      // Create notification for all users
      await API.post(
        "https://ai-powered-event-production.up.railway.app/notifications",
        {
          message: `New event created: ${data.title}`,
          type: "event",
          relatedId: eventId,
          isAdminNotification: false, // This will notify all users
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      setSuccessMessage("Event created successfully! Notifications sent to all users.")
      resetForm()
      setPreviewImage(null)
      
      setTimeout(() => {
        navigate("/admin")
      }, 2000)
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error.message)
      setErrorMessage(error.response?.data?.error || "An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Function to handle image file selection and preview
  const handleImageChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0]
    if (file) {
      setFieldValue("image", file)
      
      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // List of common event categories
  const categoryOptions = [
    "Conference",
    "Workshop",
    "Seminar",
    "Social",
    "Concert",
    "Exhibition",
    "Fitness",
    "Community",
    "Education",
    "Entertainment",
    "Fundraising",
    "Other"
  ]

  // List of event status options
  const statusOptions = [
    "active",
    "cancelled",
    "completed",
    "draft"
  ]

  // Color palette
  const colors = {
    navy: "#1A2A56",
    navyLight: "#2A3A66",
    pink: "#FF6B6B",
    pinkLight: "#FF7EA5",
    white: "#FFFFFF",
    lightGray: "#F5F7FA",
    gray: "#E2E8F0",
    darkGray: "#718096",
    errorRed: "#FF4D6A",
    successGreen: "#2DD4BF",
  }

  // Styles
  const pageContainerStyle = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: colors.lightGray,
    background: "linear-gradient(135deg, #f5f7fa 0%, #e2e8f0 100%)",
    position: "relative",
    overflow: "hidden",
  }

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    padding: "2rem",
    position: "relative",
  }

  const cardStyle = {
    width: "100%",
    maxWidth: "800px",
    backgroundColor: colors.white,
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(26, 42, 86, 0.15), 0 10px 20px rgba(26, 42, 86, 0.12)",
    overflow: "hidden",
    position: "relative",
    transform: "translateY(0)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    animation: "float 6s ease-in-out infinite",
  }

  const cardHeaderStyle = {
    backgroundColor: colors.navy,
    padding: "2.5rem",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  }

  const cardHeaderAfterStyle = {
    content: '""',
    position: "absolute",
    bottom: "0",
    left: "0",
    right: "0",
    height: "30px",
    borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
    transform: "translateY(50%)",
    backgroundColor: colors.white,
  }

  const headingStyle = {
    color: colors.white,
    fontSize: "2.25rem",
    fontWeight: "600",
    marginBottom: "1rem",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  }

  const subtitleStyle = {
    color: colors.lightGray,
    fontSize: "1rem",
    textAlign: "center",
    marginBottom: "1.5rem",
    position: "relative",
    zIndex: 1,
  }

  const formContainerStyle = {
    padding: "2.5rem",
  }

  const formGroupStyle = {
    marginBottom: "1.75rem",
  }

  const inputLabelStyle = {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: colors.navy,
    marginBottom: "0.5rem",
    display: "block",
  }

  const inputGroupStyle = {
    position: "relative",
    transition: "all 0.3s ease",
  }

  const inputIconStyle = {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.darkGray,
    zIndex: 1,
  }

  const inputBaseStyle = {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.75rem",
    fontSize: "1rem",
    color: colors.navy,
    backgroundColor: colors.lightGray,
    border: "2px solid transparent",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    outline: "none",
    boxSizing: "border-box",
  }

  const inputFocusStyle = {
    ...inputBaseStyle,
    border: `2px solid ${colors.pinkLight}`,
    boxShadow: `0 0 0 3px rgba(255, 93, 143, 0.15)`,
  }

  const textareaStyle = {
    ...inputBaseStyle,
    minHeight: "120px",
    resize: "vertical",
    paddingTop: "2.5rem",
  }

  const errorStyle = {
    color: colors.errorRed,
    fontSize: "0.85rem",
    marginTop: "0.5rem",
    fontWeight: "500",
  }

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "1rem",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: colors.white,
    backgroundColor: colors.pink,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: `0 4px 12px rgba(255, 93, 143, 0.3)`,
  }

  const buttonHoverStyle = {
    ...buttonStyle,
    backgroundColor: colors.pinkLight,
    transform: "translateY(-2px)",
    boxShadow: `0 6px 16px rgba(255, 93, 143, 0.4)`,
  }

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: "0.7",
    cursor: "not-allowed",
    boxShadow: "none",
    transform: "none",
  }

  const alertSuccessStyle = {
    padding: "1rem",
    marginBottom: "1.5rem",
    borderRadius: "12px",
    color: colors.navy,
    backgroundColor: "rgba(45, 212, 191, 0.15)",
    border: `1px solid ${colors.successGreen}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  }

  const alertDangerStyle = {
    padding: "1rem",
    marginBottom: "1.5rem",
    borderRadius: "12px",
    color: colors.navy,
    backgroundColor: "rgba(255, 77, 106, 0.15)",
    border: `1px solid ${colors.errorRed}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  }

  const footerStyle = {
    backgroundColor: colors.navy,
    color: colors.white,
    padding: "1.5rem",
    textAlign: "center",
    width: "100%",
    boxShadow: "0 -5px 10px rgba(0,0,0,0.05)",
  }

  const footerContentStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "800px",
    margin: "0 auto",
  }

  const footerTextStyle = {
    margin: "0.5rem 0",
    fontSize: "0.9rem",
    color: colors.lightGray,
  }

  const footerLinkStyle = {
    color: colors.pinkLight,
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.3s ease",
  }

  const footerIconStyle = {
    color: colors.pink,
    marginRight: "0.5rem",
    verticalAlign: "middle",
  }

  const fileInputBaseStyle = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "120px",
    padding: "1rem",
    backgroundColor: colors.lightGray,
    border: "2px dashed",
    borderColor: colors.gray,
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  }

  const fileInputFocusStyle = {
    ...fileInputBaseStyle,
    borderColor: colors.pinkLight,
    backgroundColor: "rgba(255, 93, 143, 0.05)",
  }

  const fileInputTextStyle = {
    color: colors.darkGray,
    fontSize: "0.9rem",
    marginTop: "0.5rem",
    textAlign: "center",
  }

  const imagePreviewStyle = {
    width: "100%",
    height: "200px",
    borderRadius: "12px",
    marginTop: "1rem",
    objectFit: "cover",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  }

  const checkboxStyle = {
    cursor: "pointer",
    width: "1.2rem", 
    height: "1.2rem"
  }

  // Handle hover state for the button
  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  // Adding animation using the style tag
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = `
      @keyframes float {
        0% {
          transform: translateY(0px);
          box-shadow: 0 20px 60px rgba(26, 42, 86, 0.15), 0 10px 20px rgba(26, 42, 86, 0.12);
        }
        50% {
          transform: translateY(-10px);
          box-shadow: 0 30px 70px rgba(26, 42, 86, 0.2), 0 15px 30px rgba(26, 42, 86, 0.15);
        }
        100% {
          transform: translateY(0px);
          box-shadow: 0 20px 60px rgba(26, 42, 86, 0.15), 0 10px 20px rgba(26, 42, 86, 0.12);
        }
      }
      .floating-card {
        animation: float 6s ease-in-out infinite;
      }
    `
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  return (
    <div style={pageContainerStyle}>
      <div style={containerStyle}>
        <div style={cardStyle} className="floating-card">
          <div style={cardHeaderStyle}>
            <h2 style={headingStyle}>Create Event</h2>
            <p style={subtitleStyle}>Share your exciting event with the community</p>
            <div style={cardHeaderAfterStyle}></div>
          </div>

          <div style={formContainerStyle}>
            <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
              {({ isSubmitting, touched, setFieldTouched, setFieldValue, values }) => (
                <Form>
                  {/* Success Message */}
                  {successMessage && <div style={alertSuccessStyle}>{successMessage}</div>}

                  {/* Error Message */}
                  {errorMessage && <div style={alertDangerStyle}>{errorMessage}</div>}

                  {/* Title */}
                  <div style={formGroupStyle}>
                    <label htmlFor="title" style={inputLabelStyle}>Event Title</label>
                    <div style={inputGroupStyle}>
                      <div style={inputIconStyle}>
                        <FaFileAlt size={16} color={colors.darkGray} />
                      </div>
                      <Field
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Enter a catchy title for your event"
                        style={touched.title ? inputFocusStyle : inputBaseStyle}
                        onFocus={() => setFieldTouched('title', true)}
                      />
                    </div>
                    <ErrorMessage name="title" component="div" style={errorStyle} />
                  </div>

                  {/* Two column layout for location and date */}
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    {/* Location - Left column */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="location" style={inputLabelStyle}>Event Location</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaMapMarkerAlt size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          type="text"
                          id="location"
                          name="location"
                          placeholder="Where will your event take place?"
                          style={touched.location ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('location', true)}
                        />
                      </div>
                      <ErrorMessage name="location" component="div" style={errorStyle} />
                    </div>

                    {/* Category - Right column */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="category" style={inputLabelStyle}>Event Category</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaTag size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          as="select"
                          id="category"
                          name="category"
                          style={touched.category ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('category', true)}
                        >
                          <option value="">Select a category</option>
                          {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Field>
                      </div>
                      <ErrorMessage name="category" component="div" style={errorStyle} />
                    </div>
                  </div>

                  {/* Two column layout for date and time */}
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    {/* Date - Left column */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="date" style={inputLabelStyle}>Event Date</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaCalendarAlt size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          type="date"
                          id="date"
                          name="date"
                          style={touched.date ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('date', true)}
                        />
                      </div>
                      <ErrorMessage name="date" component="div" style={errorStyle} />
                    </div>

                    {/* Time - Right column */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="time" style={inputLabelStyle}>Event Time</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaClock size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          type="time"
                          id="time"
                          name="time"
                          style={touched.time ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('time', true)}
                        />
                      </div>
                      <ErrorMessage name="time" component="div" style={errorStyle} />
                    </div>
                  </div>
                  
                  {/* Status - New field */}
                  <div style={formGroupStyle}>
                    <label htmlFor="status" style={inputLabelStyle}>Event Status</label>
                    <div style={inputGroupStyle}>
                      <div style={inputIconStyle}>
                        <FaCalendarCheck size={16} color={colors.darkGray} />
                      </div>
                      <Field
                        as="select"
                        id="status"
                        name="status"
                        style={touched.status ? inputFocusStyle : inputBaseStyle}
                        onFocus={() => setFieldTouched('status', true)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </Field>
                    </div>
                    <ErrorMessage name="status" component="div" style={errorStyle} />
                  </div>

                  {/* Description */}
                  <div style={formGroupStyle}>
                    <label htmlFor="description" style={inputLabelStyle}>Event Description</label>
                    <div style={inputGroupStyle}>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        placeholder="Share all exciting details about your event"
                        style={textareaStyle}
                        onFocus={() => setFieldTouched('description', true)}
                      />
                    </div>
                    <ErrorMessage name="description" component="div" style={errorStyle} />
                  </div>
                  
                  {/* Paid Event Toggle and Price */}
                  <div style={formGroupStyle}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                      <Field
                        type="checkbox"
                        id="isPaid"
                        name="isPaid"
                        style={checkboxStyle}
                        onChange={(e) => {
                          setFieldValue("isPaid", e.target.checked);
                          if (!e.target.checked) {
                            setFieldValue("price", 0);
                          }
                        }}
                        checked={values.isPaid}
                      />
                      <label 
                        htmlFor="isPaid" 
                        style={{ 
                          ...inputLabelStyle, 
                          marginLeft: "0.5rem", 
                          marginBottom: 0,
                          cursor: "pointer" 
                        }}
                      >
                        This is a paid event
                      </label>
                    </div>
                    
                    {values.isPaid && (
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaDollarSign size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          type="number"
                          id="price"
                          name="price"
                          placeholder="Ticket price"
                          min="0.01"
                          step="0.01"
                          style={touched.price ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('price', true)}
                        />
                        <ErrorMessage name="price" component="div" style={errorStyle} />
                      </div>
                    )}
                  </div>
                  
                  {/* Ticket Information */}
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    {/* Tickets Available */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="ticketsAvailable" style={inputLabelStyle}>Available Tickets</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaTicketAlt size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          type="number"
                          id="ticketsAvailable"
                          name="ticketsAvailable"
                          min="1"
                          placeholder="100"
                          style={touched.ticketsAvailable ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('ticketsAvailable', true)}
                        />
                      </div>
                      <ErrorMessage name="ticketsAvailable" component="div" style={errorStyle} />
                    </div>

                    {/* Registration Deadline */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="registrationDeadline" style={inputLabelStyle}>Registration Deadline</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaCalendarCheck size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          type="date"
                          id="registrationDeadline"
                          name="registrationDeadline"
                          style={touched.registrationDeadline ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('registrationDeadline', true)}
                        />
                      </div>
                      <ErrorMessage name="registrationDeadline" component="div" style={errorStyle} />
                    </div>
                  </div>
                  
                  {/* Min/Max Registration */}
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    {/* Min Registrations */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="minRegistrations" style={inputLabelStyle}>Minimum Registrations</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaUserPlus size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          type="number"
                          id="minRegistrations"
                          name="minRegistrations"
                          min="1"
                          placeholder="1"
                          style={touched.minRegistrations ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('minRegistrations', true)}
                        />
                      </div>
                      <ErrorMessage name="minRegistrations" component="div" style={errorStyle} />
                    </div>

                    {/* Max Registrations */}
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                      <label htmlFor="maxRegistrations" style={inputLabelStyle}>Maximum Registrations</label>
                      <div style={inputGroupStyle}>
                        <div style={inputIconStyle}>
                          <FaUsers size={16} color={colors.darkGray} />
                        </div>
                        <Field
                          type="number"
                          id="maxRegistrations"
                          name="maxRegistrations"
                          min="1"
                          placeholder="Optional"
                          style={touched.maxRegistrations ? inputFocusStyle : inputBaseStyle}
                          onFocus={() => setFieldTouched('maxRegistrations', true)}
                        />
                      </div>
                      <ErrorMessage name="maxRegistrations" component="div" style={errorStyle} />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div style={formGroupStyle}>
                    <label htmlFor="image" style={inputLabelStyle}>Event Image</label>
                    <div style={touched.image ? fileInputFocusStyle : fileInputBaseStyle}>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={(event) => handleImageChange(event, setFieldValue)}
                        style={{ display: "none" }}
                      />
                      <label htmlFor="image" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                        <FaImage size={24} color={colors.darkGray} />
                        <p style={fileInputTextStyle}>
                          {previewImage ? "Change image" : "Upload an event image (optional)"}
                        </p>
                      </label>
                    </div>
                    <ErrorMessage name="image" component="div" style={errorStyle} />
                    
                    {/* Image Preview */}
                    {previewImage && (
                      <div style={{ marginTop: "1rem" }}>
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          style={imagePreviewStyle} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    style={isSubmitting ? disabledButtonStyle : (isHovered ? buttonHoverStyle : buttonStyle)}
                    disabled={isSubmitting}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <FaPlus size={16} />
                    {isSubmitting ? "Creating..." : "Create Event"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      {/* Footer with accessibility-compliant links */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p style={{ ...footerTextStyle, fontWeight: "600", fontSize: "1rem" }}>
            <FaHeart style={footerIconStyle} /> EventHub Community
          </p>
          <p style={footerTextStyle}>
            Connect with event organizers and attendees from around the world
          </p>
          <p style={footerTextStyle}>
            <button 
              onClick={() => navigate("/terms")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Terms
            </button> •
            <button 
              onClick={() => navigate("/privacy")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", margin: "0 0.5rem", padding: 0}}
            >
              Privacy
            </button> •
            <button 
              onClick={() => navigate("/support")} 
              style={{...footerLinkStyle, background: "none", border: "none", cursor: "pointer", padding: 0}}
            >
              Support
            </button>
          </p>
          <p style={{ ...footerTextStyle, marginTop: "0.5rem", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default CreateEvent;