import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

const EVENTS_COLLECTION = 'events';

// Create new event
export const createEvent = async (eventData) => {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      eventId: docRef.id,
      message: 'تم إنشاء الفعالية بنجاح'
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update event
export const updateEvent = async (eventId, eventData) => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'تم تحديث الفعالية بنجاح'
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete event
export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
    return {
      success: true,
      message: 'تم حذف الفعالية بنجاح'
    };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all events
export const getAllEvents = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'))
    );
    
    const events = [];
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      events
    };
  } catch (error) {
    console.error('Error getting events:', error);
    return {
      success: false,
      error: error.message,
      events: []
    };
  }
};

// Get active events
export const getActiveEvents = async () => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const events = [];
    
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by date in JavaScript instead of Firestore
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      success: true,
      events
    };
  } catch (error) {
    console.error('Error getting active events:', error);
    return {
      success: false,
      error: error.message,
      events: []
    };
  }
};

// Get event by ID
export const getEventById = async (eventId) => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        event: {
          id: docSnap.id,
          ...docSnap.data()
        }
      };
    } else {
      return {
        success: false,
        error: 'Event not found'
      };
    }
  } catch (error) {
    console.error('Error getting event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Listen to events in real-time
export const listenToEvents = (callback) => {
  const q = query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const events = [];
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(events);
  });
};

// Toggle event status
export const toggleEventStatus = async (eventId, currentStatus) => {
  try {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    
    await updateDoc(eventRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `تم ${newStatus === 'active' ? 'تفعيل' : 'إغلاق'} الفعالية بنجاح`
    };
  } catch (error) {
    console.error('Error toggling event status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


// RSVP to event
export const rsvpToEvent = async (eventId, userId, response) => {
  try {
    console.log('RSVP - Starting:', { eventId, userId, response });
    const rsvpRef = collection(db, 'event_rsvps');
    
    // Check if user already RSVP'd
    const q = query(rsvpRef, where('eventId', '==', eventId), where('userId', '==', userId));
    const existingRsvp = await getDocs(q);
    
    if (!existingRsvp.empty) {
      // Update existing RSVP
      const docId = existingRsvp.docs[0].id;
      console.log('RSVP - Updating existing:', docId);
      await updateDoc(doc(db, 'event_rsvps', docId), {
        response,
        updatedAt: new Date().toISOString()
      });
      console.log('RSVP - Updated successfully');
    } else {
      // Create new RSVP
      console.log('RSVP - Creating new');
      const newDoc = await addDoc(rsvpRef, {
        eventId,
        userId,
        response,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('RSVP - Created successfully:', newDoc.id);
    }

    return {
      success: true,
      message: response === 'confirmed' ? 'تم تأكيد الحضور' : 'تم الاعتذار عن الحضور'
    };
  } catch (error) {
    console.error('Error RSVP to event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get user RSVP for event
export const getUserRsvp = async (eventId, userId) => {
  try {
    const q = query(
      collection(db, 'event_rsvps'),
      where('eventId', '==', eventId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return {
        success: true,
        rsvp: {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        }
      };
    }
    
    return {
      success: true,
      rsvp: null
    };
  } catch (error) {
    console.error('Error getting user RSVP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get event RSVP count
export const getEventRsvpCount = async (eventId) => {
  try {
    const q = query(
      collection(db, 'event_rsvps'),
      where('eventId', '==', eventId),
      where('response', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(q);
    
    return {
      success: true,
      count: querySnapshot.size
    };
  } catch (error) {
    console.error('Error getting RSVP count:', error);
    return {
      success: false,
      count: 0
    };
  }
};
