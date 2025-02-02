import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from 'yup';
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ✅ Replace useHistory with useNavigate

function CreateEvent() {
  let navigation = useNavigate();
  const initialValues = {
     title: "", 
     location: "", 
     description: "", 
     date: new Date().toISOString().split('T')[0], // ✅ Set default date properly
     username: ""
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'), 
    location: Yup.string().required('Location is required'), 
    description: Yup.string().required('Description is required'), 
    date: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format') // ✅ Ensures valid date format
        .required('Date is required'),  
    username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(15, 'Username can\'t be more than 15 characters')
        .required('Username is required'),
});

  
const onSubmit = (data) => {
  console.log("Submitting Data:", data); // ✅ Debug before sending

  axios.post("http://localhost:3001/events", data)
      .then((response) => {
          navigation("/");
      })
      .catch((error) => {
          console.error("Error:", error.response ? error.response.data : error.message);
      });

  };



  return (
    <div className="createPostPage">
      <div className="formContainer">
        <Formik
          initialValues={initialValues}
          onSubmit={onSubmit} 
          validationSchema={validationSchema}
        >
          <Form>
            <label>Title:</label>
            <Field id="inputCreatePost" name="title" placeholder="(Ex. Title...)" />
            <ErrorMessage name="title" component="span" />

            <label>Location:</label>
            <Field id="inputCreatePost" name="location" placeholder="(Ex. Location...)" />
            <ErrorMessage name="location" component="span" />

            <label>Description:</label>
            <Field id="inputCreatePost" name="description" placeholder="(Ex. Description...)" />
            <ErrorMessage name="description" component="span" />

            <label>Date:</label>
            <Field id="inputCreatePost" type="date" name="date" />
            <ErrorMessage name="date" component="span" />

            <label>Username:</label>
            <Field id="inputCreatePost" name="username" placeholder="(Ex. Username...)" />
            <ErrorMessage name="username" component="span" />

            <button type="submit">Create Event</button>
          </Form>
        </Formik>
      </div>
    </div>
  );
}

export default CreateEvent;