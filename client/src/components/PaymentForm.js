// Install required packages
// npm install @stripe/stripe-js @stripe/react-stripe-js

// Create a new file: src/components/PaymentForm.js
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const PaymentForm = ({ eventId, registrationData, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    // Create payment intent on the server
    try {
      const { data: { clientSecret } } = await axios.post(
        'https://ai-powered-event-production.up.railway.app/create-intent',
        {
          eventId,
          amount: registrationData.totalAmount * 100, // convert to cents
          email: registrationData.email
        },
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
          }
        }
      );

      // Confirm the payment with Stripe.js
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: registrationData.fullName,
            email: registrationData.email,
          },
        },
      });

      if (error) {
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Update registration with payment information
        await axios.put(
          `https://ai-powered-event-production.up.railway.app/registrations/${registrationData.id}/payment`,
          {
            paymentStatus: 'completed',
            paymentMethod: 'credit_card',
            transactionId: paymentIntent.id
          },
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
            }
          }
        );
        
        onSuccess(paymentIntent);
      }
    } catch (error) {
      onError(error.response?.data?.error || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="mb-4">
        <label className="form-label">Card Details</label>
        <div className="card-element-container">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>
      <button 
        type="submit" 
        className="btn w-100" 
        disabled={!stripe || loading}
        style={{ 
          backgroundColor: "#FF6B6B", 
          color: "white",
          opacity: (!stripe || loading) ? 0.7 : 1
        }}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Processing...
          </>
        ) : (
          `Pay $${registrationData.totalAmount.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

export default PaymentForm;