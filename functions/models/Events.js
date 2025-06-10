const admin = require('firebase-admin');
const db = admin.firestore();
const eventsCollection = db.collection('events');

// Get all events
exports.getAllEvents = async () => {
  try {
    const snapshot = await eventsCollection.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting events:", error);
    throw error;
  }
};

// Create event
exports.createEvent = async (eventData) => {
  try {
    const result = await eventsCollection.add({
      ...eventData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: result.id, ...eventData };
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};