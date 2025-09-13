import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

// --- Redux Imports ---
import {
  fetchRoadmapBySlug,
  clearCurrentRoadmap,
  forkRoadmap,
  addOrUpdateRating
} from '../store/redux/learningRoadmapSlice'; // Adjust this import path to your project structure

// --- Icon Imports ---
import {
  AlertCircle, Star, Heart, CalendarDays, User, Clock, CheckSquare,
  BookOpen, Video, FileText, Link as LinkIcon, Briefcase, Lightbulb,
  Tag, ListChecks, ArrowLeft, GitFork, Send, Loader2
} from 'lucide-react';


//================================================================================
// 1. Skeleton Loader Component
//================================================================================
const DetailSkeleton = () => (
  <div className="w-full mx-auto animate-pulse">
    <div className="h-8 w-1/3 bg-muted rounded-lg mb-8"></div>
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-8">
      <div className="h-60 md:h-80 bg-muted rounded-lg mb-6"></div>
      <div className="h-8 md:h-10 w-3/4 bg-muted rounded mb-4"></div>
      <div className="h-5 md:h-6 w-1/2 bg-muted rounded"></div>
    </div>
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-2/3 space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 md:p-6">
            <div className="h-6 w-1/3 bg-muted rounded mb-4"></div>
            <div className="h-20 w-full bg-muted/50 rounded-lg"></div>
          </div>
        ))}
      </div>
      <div className="lg:w-1/3">
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4">
          <div className="h-12 w-full bg-muted/50 rounded-lg"></div>
          <div className="h-24 w-full bg-muted/50 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
);


//================================================================================
// 2. Star Rating Input Component
//================================================================================
const StarRatingInput = ({ rating, setRating, disabled = false }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={ratingValue}
                        disabled={disabled}
                        className={`transition-colors duration-200 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => setRating(ratingValue)}
                        onMouseEnter={() => !disabled && setHover(ratingValue)}
                        onMouseLeave={() => !disabled && setHover(0)}
                    >
                        <Star
                            size={24}
                            className={`sm:w-7 sm:h-7 ${ratingValue <= (hover || rating) ? "text-yellow-400" : "text-muted-foreground"}`}
                            fill="currentColor"
                        />
                    </button>
                );
            })}
        </div>
    );
};


//================================================================================
// 3. Rating & Review Form
//================================================================================
const RatingForm = ({ roadmapId, userRating }) => {
    const dispatch = useDispatch();
    const { status } = useSelector(state => state.roadmaps);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    useEffect(() => {
        if (userRating) {
            setRating(userRating.rating);
            setReview(userRating.review || '');
        }
    }, [userRating]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert("Please select a star rating.");
            return;
        }
        dispatch(addOrUpdateRating({ id: roadmapId, ratingData: { rating, review } }));
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
            <h3 className="text-lg md:text-xl font-bold font-heading mb-4">{userRating ? 'Update Your Review' : 'Leave a Review'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Your Rating</label>
                    <StarRatingInput rating={rating} setRating={setRating} />
                </div>
                <div>
                    <label htmlFor="review" className="block text-sm font-medium mb-2">Your Review (optional)</label>
                    <textarea
                        id="review"
                        rows="4"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your thoughts on this roadmap..."
                        className="w-full bg-input border border-border rounded-md p-2 text-sm"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                        {userRating ? 'Update' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};


//================================================================================
// 4. Main Page Component
//================================================================================
const RoadmapDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Assumes an auth slice provides the logged-in user, e.g., state.auth.user
  const { user } = useSelector((state) => state.auth); 
  const { currentRoadmap: roadmap, status, error } = useSelector((state) => state.roadmaps);

  useEffect(() => {
    if (slug) {
      dispatch(fetchRoadmapBySlug(slug));
    }
    // Cleanup to prevent showing stale data on navigation
    return () => {
      dispatch(clearCurrentRoadmap());
    };
  }, [slug, dispatch]);

  const handleFork = () => {
      if (roadmap) {
          dispatch(forkRoadmap(roadmap._id)).then((result) => {
              if (result.type.endsWith('fulfilled')) {
                  navigate(`/roadmaps/${result.payload.slug}`);
              }
          });
      }
  };

  const isOwner = user && roadmap && user._id === roadmap.owner._id;
  const userRating = user && roadmap ? roadmap.ratings.find(r => r.user._id === user._id) : null;
  
  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-destructive" />;
      case 'article': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'documentation': return <BookOpen className="w-4 h-4 text-green-500" />;
      case 'project_source': return <Briefcase className="w-4 h-4 text-purple-500" />;
      default: return <LinkIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  const getActivityIcon = (type) => {
     switch (type) {
      case 'learning': return <Lightbulb className="w-5 h-5 text-accent-foreground" />;
      case 'practice': return <CheckSquare className="w-5 h-5 text-green-500" />;
      case 'project': return <Briefcase className="w-5 h-5 text-purple-500" />;
      case 'assessment': return <FileText className="w-5 h-5 text-blue-500" />;
      default: return null;
    }
  }

  if (status === 'loading' && !roadmap) {
    return <div className="container mx-auto px-4 py-8 md:py-12"><DetailSkeleton /></div>;
  }

  if (status === 'failed' && !roadmap) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Failed to Load Roadmap</h2>
        <p className="text-muted-foreground">{error || "The requested roadmap could not be found."}</p>
        <Link to="/roadmaps" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          <ArrowLeft size={18} />
          Back to Roadmaps
        </Link>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          
          <Link to="/roadmaps" className="inline-flex items-center gap-2 text-primary hover:underline mb-6 md:mb-8 font-semibold">
            <ArrowLeft size={20} />
            All Roadmaps
          </Link>

          <header className="bg-card border border-border rounded-2xl overflow-hidden mb-8 md:mb-12 shadow-md">
            <img 
              src={roadmap.coverImage || 'https://placehold.co/1200x400/0056d2/white?text=Roadmap'} 
              alt={roadmap.title} 
              className="w-full h-48 md:h-64 lg:h-80 object-cover"
            />
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                      <span className="bg-accent text-accent-foreground font-semibold px-3 py-1 rounded-full text-xs sm:text-sm mb-4 inline-block">{roadmap.category}</span>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-card-foreground">{roadmap.title}</h1>
                  </div>
                  {user && !isOwner && (
                       <button 
                            onClick={handleFork} 
                            disabled={status === 'loading'}
                            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                           {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <GitFork size={18} />}
                           Fork
                       </button>
                  )}
              </div>
              <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground max-w-3xl">{roadmap.description}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-6 mt-6 border-t border-border pt-6">
                  <div className="flex items-center gap-2" title="Average Rating">
                    <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                    <span className="font-bold text-base md:text-lg">{roadmap.averageRating}</span>
                    <span className="text-muted-foreground text-xs md:text-sm">({roadmap.ratings.length} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2" title="Likes">
                    <Heart className="w-5 h-5 text-destructive" />
                    <span className="font-bold text-base md:text-lg">{roadmap.likesCount}</span>
                    <span className="text-muted-foreground text-xs md:text-sm">likes</span>
                  </div>
                  <div className="flex items-center gap-2" title="Total Duration">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <span className="font-bold text-base md:text-lg">{roadmap.totalDurationDays}</span>
                    <span className="text-muted-foreground text-xs md:text-sm">days</span>
                  </div>
              </div>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            <main className="w-full lg:w-2/3">
              <h2 className="text-2xl md:text-3xl font-bold font-heading mb-6 flex items-center gap-3">
                <ListChecks className="text-primary" />
                Daily Learning Plan
              </h2>
              <div className="space-y-8">
                {roadmap.dailyPlan.map(day => (
                  <motion.div 
                    key={day.day}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5 }}
                    className="border-l-4 border-primary pl-4 sm:pl-6 py-2"
                  >
                    <h3 className="text-xl md:text-2xl font-bold font-heading text-foreground mb-1">Day {day.day}: {day.title}</h3>
                    
                    <div className="space-y-4 mt-4">
                      {day.activities.map((activity, index) => (
                        <div key={index} className="bg-card border border-border rounded-xl overflow-hidden">
                           <div className="p-4 sm:p-5">
                            <div className="flex justify-between items-start gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                  {getActivityIcon(activity.activityType)}
                                  <h4 className="text-xs sm:text-lg font-bold text-card-foreground">{activity.title}</h4>
                                </div>
                                {activity.estimatedTimeMinutes && (
                                  <div className="flex-shrink-0 flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-full">
                                    <Clock size={12} />
                                    <span>{activity.estimatedTimeMinutes} min</span>
                                  </div>
                                )}
                            </div>
                            
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mt-2"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activity.description) }}
                            />
                            
                            {activity.resources?.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <h5 className="text-sm font-semibold mb-2 text-foreground">Resources:</h5>
                                <ul className="space-y-2">
                                  {activity.resources.map((res, i) => (
                                    <li key={i}>
                                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline transition-colors">
                                        {getResourceIcon(res.resourceType)}
                                        <span className="truncate">{res.title}</span>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                           </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </main>

            <aside className="w-full lg:w-1/3 lg:sticky top-24 self-start">
               <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-base md:text-lg font-bold font-heading flex items-center gap-2 mb-3"><User /> Author</h3>
                    <div className="flex items-center gap-3">
                      <img src={roadmap.owner.profileInfo?.avatar || 'https://placehold.co/40x40'} alt={roadmap.owner.username} className="w-10 h-10 rounded-full object-cover"/>
                      <span className="font-semibold text-foreground text-sm md:text-base">{roadmap.owner.username}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base md:text-lg font-bold font-heading flex items-center gap-2 mb-3"><CheckSquare /> Prerequisites</h3>
                    {roadmap.prerequisites?.length > 0 ? (
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm md:text-base">
                        {roadmap.prerequisites.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    ): (
                      <p className="text-muted-foreground text-sm">No prerequisites required. Great for beginners!</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-bold font-heading flex items-center gap-2 mb-3"><Tag /> Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.tags.map((tag, i) => (
                        <span key={i} className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
               </div>
            </aside>
          </div>
          
          <section className="mt-12 md:mt-16">
              <h2 className="text-2xl md:text-3xl font-bold font-heading mb-6">Ratings & Reviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {user && !isOwner && (
                      <RatingForm roadmapId={roadmap._id} userRating={userRating} />
                  )}
                  {isOwner && (
                      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center text-center h-full">
                          <p className="text-muted-foreground">You cannot review your own roadmap.</p>
                      </div>
                  )}
                  {!user && (
                       <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center text-center h-full">
                          <p className="text-muted-foreground"><Link to="/login" className="text-primary font-semibold">Log in</Link> to leave a review.</p>
                      </div>
                  )}

                  <div className={isOwner || !user ? 'md:col-span-2' : ''}>
                    {roadmap.ratings.length > 0 ? (
                        <div className="space-y-4 max-h-[28rem] overflow-y-auto custom-scrollbar pr-2 md:pr-4">
                           {roadmap.ratings.map(r => (
                               <div key={r._id} className="bg-card border-b border-border p-4 rounded-lg">
                                   <div className="flex items-center gap-3 mb-2">
                                        <img src={r.user.profileInfo?.avatar || 'https://placehold.co/40x40'} alt={r.user.username} className="w-8 h-8 rounded-full object-cover" />
                                        <div>
                                            <p className="font-semibold text-sm">{r.user.username}</p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < r.rating ? 'text-yellow-400' : 'text-muted'} fill="currentColor" />)}
                                            </div>
                                        </div>
                                   </div>
                                   <p className="text-sm text-muted-foreground">{r.review}</p>
                               </div>
                           ))}
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center text-center h-full">
                            <p className="text-muted-foreground">No reviews yet. Be the first to leave one!</p>
                        </div>
                    )}
                  </div>
              </div>
          </section>

        </motion.div>
      </div>
    </div>
  );
};

export default RoadmapDetails;