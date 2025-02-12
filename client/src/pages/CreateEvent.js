import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCalendarAlt, FaMapMarkerAlt, FaUserAlt, FaFileAlt } from "react-icons/fa";

function CreateEvent() {
  let navigate = useNavigate();

  const initialValues = {
    title: "",
    location: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    username: "",
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    location: Yup.string().required("Location is required"),
    description: Yup.string().required("Description is required"),
    date: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .required("Date is required"),
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .max(15, "Username can't be more than 15 characters")
      .required("Username is required"),
  });

  const onSubmit = (data, { setSubmitting }) => {
    axios
      .post("http://localhost:3001/events", data)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error:", error.response ? error.response.data : error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-lg p-5 w-100" style={{ maxWidth: "800px" }}>
        <h2 className="text-center fw-bold mb-4">Create Event</h2>

        <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
          {({ isSubmitting }) => (
            <Form>
              {/* Title */}
              <div className="mb-4">
                <label className="form-label">Title</label>
                <div className="input-group">
                  <span className="input-group-text"><FaFileAlt /></span>
                  <Field type="text" className="form-control form-control-lg" name="title" placeholder="Enter event title" />
                </div>
                <ErrorMessage name="title" component="div" className="text-danger small" />
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="form-label">Location</label>
                <div className="input-group">
                  <span className="input-group-text"><FaMapMarkerAlt /></span>
                  <Field type="text" className="form-control form-control-lg" name="location" placeholder="Enter event location" />
                </div>
                <ErrorMessage name="location" component="div" className="text-danger small" />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="form-label">Description</label>
                <div className="input-group">
                  <span className="input-group-text"><FaFileAlt /></span>
                  <Field as="textarea" className="form-control form-control-lg" name="description" placeholder="Enter event description" rows="3" />
                </div>
                <ErrorMessage name="description" component="div" className="text-danger small" />
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="form-label">Date</label>
                <div className="input-group">
                  <span className="input-group-text"><FaCalendarAlt /></span>
                  <Field type="date" className="form-control form-control-lg" name="date" />
                </div>
                <ErrorMessage name="date" component="div" className="text-danger small" />
              </div>

              {/* Username */}
              <div className="mb-4">
                <label className="form-label">Username</label>
                <div className="input-group">
                  <span className="input-group-text"><FaUserAlt /></span>
                  <Field type="text" className="form-control form-control-lg" name="username" placeholder="Enter username" />
                </div>
                <ErrorMessage name="username" component="div" className="text-danger small" />
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
