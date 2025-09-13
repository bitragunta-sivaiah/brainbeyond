import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPublicRoadmaps } from '../store/redux/learningRoadmapSlice'; // Adjust path as needed

// --- Icon Imports ---
import { 
  AlertCircle, 
  Compass, 
  Star, 
  Heart, 
  CalendarDays, 
  User, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

//================================================================================
// 1. Skeleton Component
//================================================================================
const RoadmapSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden p-4 space-y-4 animate-pulse">
      <div className="h-40 w-full bg-muted rounded-lg"></div>
      <div className="h-6 bg-muted rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-8 w-24 bg-muted rounded-full"></div>
        <div className="h-5 w-16 bg-muted rounded"></div>
      </div>
    </div>
  );
};

//================================================================================
// 2. Card Component
//================================================================================
const RoadmapCard = ({ roadmap }) => {
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { y: -5, boxShadow: "var(--shadow-md)" }
  };

  const truncateText = (text, length = 100) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full"
    >
      <Link to={`/roadmaps/${roadmap.slug}`} className="flex flex-col h-full">
        <img
          src={roadmap.coverImage || 'https://placehold.co/600x400/0056d2/white?text=Learn'}
          alt={`${roadmap.title} cover`}
          className="w-full h-48 object-cover"
        />
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex-grow">
            <div className="flex items-center justify-between text-sm text-custom mb-2">
              <span className="bg-accent text-accent-foreground font-semibold px-2.5 py-0.5 rounded-full">{roadmap.category}</span>
              <span className="capitalize font-medium">{roadmap.skillLevel}</span>
            </div>
            <h3 className="text-xl font-bold text-card-foreground mb-2 line-clamp-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {roadmap.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-3">
              {truncateText(roadmap.description)}
            </p>
          </div>
          
          <div className="border-t border-border mt-4 pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {roadmap?.owner?.profileInfo?.avatar ? (
                   <img src={roadmap.owner.profileInfo.avatar} alt={roadmap.owner.username} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span>{roadmap?.owner?.username}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span>{roadmap?.averageRating || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 text-destructive">
                  <Heart size={16} />
                  <span>{roadmap?.likesCount}</span>
                </div>
                 <div className="flex items-center gap-1">
                  <CalendarDays size={16} />
                  <span>{roadmap?.totalDurationDays}d</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

//================================================================================
// 3. Pagination Component
//================================================================================
const Pagination = ({ pagination, currentPage, onPageChange }) => {
  if (!pagination || (!pagination.prev && !pagination.next)) {
    return null;
  }

  return (
    <div className="flex justify-center items-center space-x-4 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!pagination.prev}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
      >
        <ChevronLeft size={18} />
        Previous
      </button>
      <span className="text-lg font-medium text-foreground">{currentPage}</span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!pagination.next}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
      >
        Next
        <ChevronRight size={18} />
      </button>
    </div>
  );
};


//================================================================================
// 4. Main Page Component
//================================================================================
const Roadmaps = () => {
  const dispatch = useDispatch();
  const { roadmaps, status, pagination, error } = useSelector((state) => state.roadmaps);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // We fetch 12 items per page
    dispatch(fetchPublicRoadmaps({ page: currentPage, limit: 12 }));
  }, [dispatch, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage > 0) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0); // Scroll to top on page change
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 12 }).map((_, index) => (
            <RoadmapSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-muted rounded-lg">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Oops! Something went wrong.</h2>
          <p className="text-muted-foreground">{error || "We couldn't load the roadmaps. Please try again later."}</p>
        </div>
      );
    }
    
    if (roadmaps.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center text-center py-20 bg-muted rounded-lg">
                <Compass className="w-16 h-16 text-primary mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No Roadmaps Found</h2>
                <p className="text-muted-foreground">It seems there are no public roadmaps available right now. Why not create one?</p>
             </div>
        )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {roadmaps.map((roadmap) => (
          <RoadmapCard key={roadmap._id} roadmap={roadmap} />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-display text-primary tracking-tighter">
            Explore Learning Roadmaps
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover curated learning paths crafted by the community to master new skills.
          </p>
        </header>

        <main>
          {renderContent()}
        </main>

        {status === 'succeeded' && roadmaps.length > 0 && (
          <footer className="mt-8">
            <Pagination
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </footer>
        )}
      </div>
    </div>
  );
};

export default Roadmaps;