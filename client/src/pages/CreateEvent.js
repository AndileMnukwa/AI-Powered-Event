import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCalendarAlt, FaMapMarkerAlt, FaFileAlt } from "react-icons/fa";
import { AuthContext } from "../helpers/AuthContext";
import eventImage from "../images/event-banner.jpg"; // Import event banner
// import bgImage from "../images/background.jpg"; 

function CreateEvent() {
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentDate] = useState(new Date().toISOString().split("T")[0]);

  const initialValues = {
    title: "",
    location: "",
    description: "",
    date: currentDate,
  };

  useEffect(() => {
    if (!authState.status) {
      navigate("/login");
    }
  }, [authState, navigate]);

  const validationSchema = Yup.object().shape({
    title: Yup.string().trim().required("Title is required"),
    location: Yup.string().trim().required("Location is required"),
    description: Yup.string().trim().required("Description is required"),
    date: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .required("Date is required"),
  });

  const onSubmit = async (data, { setSubmitting, setErrors }) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setErrors({ general: "Unauthorized. Please log in again." });
      setSubmitting(false);
      return;
    }

    try {
      await axios.post("http://localhost:3001/events", data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      navigate("/");
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error.message);
      setErrors({ general: error.response?.data?.error || "An unexpected error occurred" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
    className="d-flex justify-content-center align-items-center vh-100"
    style={{
      backgroundImage: "url(../images/background.jpg)", // No import needed!
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      minHeight: "100vh",
      width: "100%",
    }}
  >
  
  
      <div className="card shadow-lg p-5 w-100" style={{ maxWidth: "1000px", backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "15px" }}>
        
        {/* Event Image */}
        <div className="text-center mb-4">
          <img src={eventImage} alt="Event Banner" className="img-fluid rounded" style={{ maxHeight: "200px", width: "100%", objectFit: "cover" }} />
        </div>

        <h2 className="text-center glitch-text">
  Create Event
</h2>


        <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
          {({ isSubmitting, errors }) => (
            <Form>
              {errors.general && <div className="alert alert-danger">{errors.general}</div>}

              {/* Title */}
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text"><FaFileAlt /></span>
                  <Field type="text" className="form-control form-control-lg" name="title" placeholder="Enter event title" />
                </div>
                <ErrorMessage name="title" component="div" className="text-danger small" />
              </div>

              {/* Location */}
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text"><FaMapMarkerAlt /></span>
                  <Field type="text" className="form-control form-control-lg" name="location" placeholder="Enter event location" />
                </div>
                <ErrorMessage name="location" component="div" className="text-danger small" />
              </div>

              {/* Description */}
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text"><FaFileAlt /></span>
                  <Field as="textarea" className="form-control form-control-lg" name="description" placeholder="Enter event description" rows="3" />
                </div>
                <ErrorMessage name="description" component="div" className="text-danger small" />
              </div>

              {/* Date */}
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text"><FaCalendarAlt /></span>
                  <Field type="date" className="form-control form-control-lg" name="date" />
                </div>
                <ErrorMessage name="date" component="div" className="text-danger small" />
              </div>

              {/* Submit */}
              <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Event"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default CreateEvent;
