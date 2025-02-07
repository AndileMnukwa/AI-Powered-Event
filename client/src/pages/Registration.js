import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function Registration() {
  const [successMessage, setSuccessMessage] = useState("");

  const initialValues = {
    username: "",
    password: "",
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .max(15, "Username can't be more than 15 characters")
      .required("Username is required"),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .max(20, "Password can't be more than 20 characters")
      .required("Password is required"),
  });

  const onSubmit = (data, { setSubmitting, resetForm }) => {
    axios
      .post("http://localhost:3001/auth", data)
      .then(() => {
        setSuccessMessage("Successfully registered!");
        resetForm(); // Clear form after submission
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        setSubmitting(false); // Reset button state
      });
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Register</h2>

        {/* Success Message Alert */}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          {({ isSubmitting }) => (
            <Form>
              {/* Username Field */}
              <div className="mb-3">
                <label className="form-label">Username</label>
                <Field type="text" className="form-control" name="username" placeholder="Enter username" />
                <ErrorMessage name="username" component="div" className="text-danger" />
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label className="form-label">Password</label>
                <Field type="password" className="form-control" name="password" placeholder="Enter password" />
                <ErrorMessage name="password" component="div" className="text-danger" />
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Register"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default Registration;
