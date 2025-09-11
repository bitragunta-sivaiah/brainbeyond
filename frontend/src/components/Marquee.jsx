import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPublicMarqueeMessages } from '../store/redux/marqueeSlice'; // Adjust the import path as needed
import { motion } from 'framer-motion';
import { Loader2, Bell } from 'lucide-react';
 

const Marquee = () => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector((state) => state.marquee);

  useEffect(() => {
    dispatch(fetchPublicMarqueeMessages());
  }, [dispatch]);

  const marqueeContent = useMemo(() => {
    if (messages.length === 0) {
      return null;
    }

    // Combine all messages into a single string for scrolling
    // We add a separator to make messages distinct
    const content = messages
      .map(
        (msg) =>
          `<span class="px-8 flex-shrink-0 text-sm font-medium">
             ${msg.link ? `<a href="${msg.link}" target="_blank" rel="noopener noreferrer" class="hover:underline">${msg.message}</a>` : msg.message}
           </span>`
      )
      .join('<span class="text-secondary-foreground">|</span>');
      
    // Duplicate the content to create a seamless infinite loop
    return content + content;
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2 bg-secondary text-secondary-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading announcements...</span>
      </div>
    );
  }

  if (error) {
    // You might want to hide the marquee entirely on error for public view
    return null;
  }

  // Only render the marquee if there are messages to display
  if (messages.length === 0) {
    return null;
  }
  
  // Calculate animation duration based on content length for a more consistent speed
  const animationDuration = `${messages.length * 15}s`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-secondary text-secondary-foreground shadow-md relative py-2 overflow-hidden flex items-center"
      style={{ '--duration': animationDuration }}
    >
       
      <div className="marquee-container w-full pl-12">
        <div className="marquee-content" dangerouslySetInnerHTML={{ __html: marqueeContent }} />
      </div>
    </motion.div>
  );
};

export default Marquee;