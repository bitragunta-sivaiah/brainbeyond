import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Globe, Users, Clock, ArrowRight,Check  } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Assuming you have this library installed

import {
  fetchEvents,
  registerForEvent,
} from '../store/redux/eventSlice'; // Adjust the path as needed

const Events = () => {
  const dispatch = useDispatch();
  const { events, loading, error } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const handleRegister = (eventId) => {
    if (!user) {
      toast.error('Please log in to register for an event.');
      return;
    }
    dispatch(registerForEvent(eventId));
  };

  if (loading) {
    return <div className="text-center py-16 font-body text-xl text-primary">Loading events...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-destructive font-body text-xl">Error: {error}</div>;
  }

  return (
    <div className="bg-background py-16 sm:py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-foreground mb-4">
            Upcoming Events
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover a variety of events designed to connect, inspire, and educate. Join our vibrant community and grow with us.
          </p>
        </div>

        {events.length === 0 && !loading && !error && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <p className="text-xl">No upcoming events found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {events.map((event) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.5 }}
                className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                <div className="relative h-56">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Calendar className="h-16 w-16 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h2 className="text-2xl font-heading font-semibold text-foreground mb-2">
                    {event.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {event.description}
                  </p>
                  <div className="flex-grow space-y-4 text-sm text-secondary-foreground">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        {new Date(event.startDate).toLocaleDateString()} at{' '}
                        {new Date(event.startDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {event.isOnline ? (
                        <Globe className="h-5 w-5 text-primary" />
                      ) : (
                        <MapPin className="h-5 w-5 text-primary" />
                      )}
                      <span className="font-medium">
                        {event.isOnline ? 'Online Event' : event.location}
                      </span>
                    </div>
                    {event.registrationRequired && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-medium">
                          {event.attendees.length} /{' '}
                          {event.maxAttendees || '∞'} registered
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    {user?.role === 'student' && event.registrationRequired && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRegister(event._id)}
                        className="w-full py-3 text-white font-bold rounded-lg bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        disabled={
                          event.attendees.includes(user._id) ||
                          (event.maxAttendees &&
                            event.attendees.length >= event.maxAttendees)
                        }
                      >
                        {event.attendees.includes(user._id) ? (
                          <>
                            Registered
                            <Check className="h-4 w-4 ml-2" />
                          </>
                        ) : (
                          <>
                            Register Now
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </motion.button>
                    )}
                    {(!event.registrationRequired || user?.role !== 'student') && (
                      <span className="w-full text-center block py-3 text-muted-foreground font-medium rounded-lg border border-border">
                        {event.registrationRequired
                          ? 'Registration for this event is closed'
                          : 'No Registration Required'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Events;