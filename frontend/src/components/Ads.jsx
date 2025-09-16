import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAds } from "../store/redux/dataSlice"; // Assuming dataSlice handles ads
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Info, XCircle, Expand, X, Link } from "lucide-react";

// Custom hook to manage ad carousel logic
const useCarousel = (ads) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Reset index if ads change to avoid out-of-bounds errors
    setActiveIndex(0);

    if (ads.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % ads.length);
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(timer);
  }, [ads]); // Rerun effect when the ads array itself changes

  return { activeIndex };
};

// Component to display remaining time (No changes needed)
const RemainingTime = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [color, setColor] = useState('text-green-500');

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate) - new Date();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);

        if (days > 0) {
          setTimeLeft(`${days}d`);
          setColor('text-green-500');
        } else if (hours > 0) {
          setTimeLeft(`${hours}h`);
          setColor('text-orange-500');
        } else {
          setTimeLeft(`${minutes}m`);
          setColor('text-red-500');
        }
      } else {
        setTimeLeft('Expired');
        setColor('text-gray-500');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!endDate) return null;

  return (
    <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm z-30 ${color}`}>
      {timeLeft}
    </span>
  );
};

// Modal for expanded ad view (No changes needed)
const AdModal = ({ ad, onClose }) => {
  if (!ad) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-card rounded-xl shadow-2xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors z-40" aria-label="Close Ad">
            <X size={20} />
          </button>
          <img src={ad.image} alt={ad.title} className="w-full h-auto object-cover rounded-t-xl" />
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-semibold text-foreground">{ad.title}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This advertisement is for a {ad.position.replace(/-/g, ' ')} placement.
            <br />
            Valid until: {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'No end date'}
          </p>
          <a href={ad.link || "#"} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            Visit Website <Link size={16} className="ml-2"/>
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Ads Component
 */
const Ads = ({ position }) => {
  const dispatch = useDispatch();
  const { ads, status, error } = useSelector((state) => state.data);
  const [expandedAd, setExpandedAd] = useState(null);
  const [hiddenAds, setHiddenAds] = useState(new Set());

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAds());
    }
  }, [dispatch, status]);

  const filteredAds = useMemo(() => {
    const now = new Date();
    if (!ads || !Array.isArray(ads)) return [];
    return ads
      .filter(ad => !hiddenAds.has(ad._id))
      .filter(ad =>
        ad.position === position &&
        ad.isActive &&
        (!ad.startDate || new Date(ad.startDate) <= now) &&
        (!ad.endDate || new Date(ad.endDate) >= now)
      );
  }, [ads, position, hiddenAds]);

  // CORRECTION: Carousel now depends on the memoized filteredAds
  const { activeIndex } = useCarousel(filteredAds);

  const handleCloseAd = useCallback((id) => {
    // CORRECTION: Use immutable update for the Set to prevent bugs
    setHiddenAds(prev => new Set([...prev, id]));
  }, []);

  const handleExpandAd = useCallback((ad) => {
    setExpandedAd(ad);
  }, []);

  const containerClasses = useMemo(() => {
    switch (position) {
      // NEW: Added style for enroll-course to be a fixed, centered modal
      case 'enroll-course':
        return 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4';
      case 'homepage-top':
        return 'fixed top-4 left-1/2 -translate-x-1/2 w-[95%] md:w-auto z-50';
      case 'homepage-side':
        return 'fixed bottom-4 right-4 w-[250px] md:w-[300px] z-50';
      case 'course-side':
        return 'sticky top-20';
      case 'article-bottom':
        return 'w-full my-8';
      default:
        return 'w-full';
    }
  }, [position]);
  
  // Robustness check for loading, error, or no ads
  if (status === "loading") return (
    <div className={`flex items-center justify-center p-4 ${containerClasses}`}>
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (status === "failed") return (
    <div className={`flex items-center justify-center p-4 text-destructive-foreground bg-destructive rounded-lg ${containerClasses}`}>
       <XCircle className="w-5 h-5 mr-2" /> Error loading ads.
    </div>
  );
  
  // CORRECTION: Return null instead of an empty div if no ads are found
  if (filteredAds.length === 0) {
    return null;
  }
  
  // CORRECTION: Safely get the current ad, preventing crashes if arrays change
  const currentAd = filteredAds.length > activeIndex ? filteredAds[activeIndex] : null;

  if (!currentAd) {
    return null;
  }

  const AdContent = (
    <motion.div
      key={currentAd._id}
      className="relative w-full overflow-hidden shadow-lg group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <RemainingTime endDate={currentAd.endDate} />
      
      {/* Action buttons */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2 z-40">
        <button onClick={() => handleExpandAd(currentAd)} className="p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors" aria-label="Expand Ad">
          <Expand size={16} />
        </button>
        {/* For the modal-like 'enroll-course', the main 'X' button will close it */}
        {position !== 'enroll-course' && (
          <button onClick={() => handleCloseAd(currentAd._id)} className="p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors" aria-label="Close Ad">
            <X size={16} />
          </button>
        )}
      </div>
      
      <a href={currentAd.link || "#"} target="_blank" rel="noopener noreferrer" aria-label={`Advertisement for ${currentAd.title}`}>
        <img
          src={currentAd.image}
          alt={currentAd.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/gray/white?text=Ad`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="p-4 absolute bottom-0 z-30 w-full left-0">
          <h3 className="text-lg font-bold text-white tracking-wide">{currentAd.title}</h3>
        </div>
      </a>
    </motion.div>
  );

  // NEW: Special render path for 'enroll-course' to create a modal-like experience
  if (position === 'enroll-course') {
    return (
      <div className={containerClasses}>
        <div className="bg-card rounded-sm shadow-md overflow-hidden max-w-lg w-full relative">
          <button onClick={() => handleCloseAd(currentAd._id)} className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black transition-colors z-50" aria-label="Close Ad">
            <X size={20} />
          </button>
          {AdContent}
        </div>
        <AnimatePresence>
          {expandedAd && <AdModal ad={expandedAd} onClose={() => setExpandedAd(null)} />}
        </AnimatePresence>
      </div>
    );
  }

  // Default render for all other positions
  return (
    <div className={`ads-container rounded-sm shadow-md overflow-hidden ${containerClasses}`}>
      <AnimatePresence mode="wait">
        {AdContent}
      </AnimatePresence>
      <AnimatePresence>
        {expandedAd && <AdModal ad={expandedAd} onClose={() => setExpandedAd(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Ads;