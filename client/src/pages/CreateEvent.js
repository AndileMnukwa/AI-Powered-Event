import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; // ✅ Import Bootstrap CSS

function CreateEvent() {
  let navigate = useNavigate();

  const initialValues = {
    title: "",
    location: "",
    description: "",
    date: new Date().toISOString().split("T")[0], // ✅ Set default date properly
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

  const onSubmit = (data) => {
    console.log("Submitting Data:", data);
    axios
      .post("http://localhost:3001/events", data)
      .then((response) => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error:", error.response ? error.response.data : error.message);
      });
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Create Event</h2>
        <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
          {({ isSubmitting }) => (
            <Form>
              {/* Title Field */}
              <div className="mb-3">
                <label className="form-label">Title</label>
                <Field type="text" className="form-control" name="title" placeholder="Enter event title" />
                <ErrorMessage name="title" component="div" className="text-danger" />
              </div>

              {/* Location Field */}
              <div className="mb-3">
                <label className="form-label">Location</label>
                <Field type="text" className="form-control" name="location" placeholder="Enter event location" />
                <ErrorMessage name="location" component="div" className="text-danger" />
              </div>

              {/* Description Field */}
              <div className="mb-3">
                <label className="form-label">Description</label>
                <Field as="textarea" className="form-control" name="description" placeholder="Enter event description" />
                <ErrorMessage name="description" component="div" className="text-danger" />
              </div>

              {/* Date Field */}
              <div className="mb-3">
                <label className="form-label">Date</label>
                <Field type="date" className="form-control" name="date" />
                <ErrorMessage name="date" component="div" className="text-danger" />
              </div>

              {/* Username Field */}
              <div className="mb-3">
                <label className="form-label">Username</label>
                <Field type="text" className="form-control" name="username" placeholder="Enter username" />
                <ErrorMessage name="username" component="div" className="text-danger" />
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
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
