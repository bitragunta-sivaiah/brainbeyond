// RoadManager.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createLearningRoadmap,
  fetchLearningRoadmaps,
  fetchLearningRoadmapById,
  updateLearningRoadmap,
  deleteLearningRoadmap,
  likeLearningRoadmap,
  forkLearningRoadmap,
  clearCurrentRoadmap,
  clearRoadmapError,
} from '../store/redux/learningRoadmapSlice'; // Adjusted path
import {
  Plus,
  Edit,
  Trash2,
  Heart,
  GitFork,
  Eye,
  X,
  BookOpen,
  CalendarDays,
  Gauge,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Clock,
  Briefcase,
  Star,
  Zap,
  Filter,
  Search,
  Users,
  Loader,
} from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa'; // For a user icon
import toast from 'react-hot-toast'; // Re-import toast for direct use if needed

// Helper to convert HTML strings to JSX, handling plain URLs
const HtmlRenderer = ({ htmlContent }) => {
  // Check if the content is a URL (starts with http/https and doesn't contain other HTML tags)
  const isPlainUrl = (str) => {
    try {
      const url = new URL(str);
      return (url.protocol === 'http:' || url.protocol === 'https:') && !/<[a-z][\s\S]*>/i.test(str);
    } catch {
      return false;
    }
  };

  if (isPlainUrl(htmlContent)) {
    return (
      <a href={htmlContent} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {htmlContent}
      </a>
    );
  }

  // If it's not a plain URL, assume it's already HTML or plain text to be rendered as is
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

const RoadManager = () => {
  const dispatch = useDispatch();
  const { roadmaps, currentRoadmap, loading, error } = useSelector((state) => state.learningRoadmap);
  // Assuming you have an auth slice that stores the current user's ID
  const userId = useSelector((state) => state.auth?.user?._id); // Replace 'state.auth.user._id' with your actual auth state path

  // --- State for UI interactions ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentViewDay, setCurrentViewDay] = useState(1);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null); // For custom confirmation

  // State for Create Roadmap form
  const [newRoadmapData, setNewRoadmapData] = useState({
    skill: '',
    skillLevel: 'beginner',
    totalDurationDays: 7,
  });

  // State for Edit Roadmap form (pre-filled with currentRoadmap data)
  const [editRoadmapData, setEditRoadmapData] = useState({
    title: '',
    description: '',
    skill: '',
    skillLevel: '',
    totalDurationDays: 0,
    dailyPlan: [],
    tags: [],
    isPublic: false,
    status: 'draft',
  });

  // State for Filtering and Search
  const [filterSkill, setFilterSkill] = useState('');
  const [filterSkillLevel, setFilterSkillLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');


  // --- Fetch Roadmaps on Component Mount and Filter/Search Changes ---
  useEffect(() => {
    const queryParams = {};
    if (filterSkill) queryParams.skill = filterSkill;
    if (filterSkillLevel) queryParams.skillLevel = filterSkillLevel;
    if (filterStatus) queryParams.status = filterStatus;
    // For search, you might need a backend route that supports text search across title/description
    // For this example, we'll assume filtering on the client-side for simplicity,
    // or you can add `queryParams.search = searchQuery` if your API supports it.
    dispatch(fetchLearningRoadmaps(queryParams));
  }, [dispatch, filterSkill, filterSkillLevel, filterStatus]);

  // Handle current roadmap updates for view/edit modals
  useEffect(() => {
    if (currentRoadmap) {
      if (showViewModal) {
        setCurrentViewDay(1); // Reset to day 1 when viewing a new roadmap
      }
      if (showEditModal) {
        setEditRoadmapData({
          title: currentRoadmap.title,
          description: currentRoadmap.description,
          skill: currentRoadmap.skill,
          skillLevel: currentRoadmap.skillLevel,
          totalDurationDays: currentRoadmap.totalDurationDays,
          dailyPlan: currentRoadmap.dailyPlan,
          tags: currentRoadmap.tags,
          isPublic: currentRoadmap.isPublic,
          status: currentRoadmap.status,
        });
      }
    }
  }, [currentRoadmap, showViewModal, showEditModal]);

  // --- Form Handlers ---
  const handleNewRoadmapChange = (e) => {
    const { name, value } = e.target;
    setNewRoadmapData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditRoadmapChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditRoadmapData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    await dispatch(createLearningRoadmap(newRoadmapData));
    setShowCreateModal(false);
    setNewRoadmapData({ skill: '', skillLevel: 'beginner', totalDurationDays: 7 }); // Reset form
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentRoadmap) return;
    await dispatch(updateLearningRoadmap({ id: currentRoadmap._id, roadmapData: editRoadmapData }));
    setShowEditModal(false);
  };

  // --- Action Handlers ---
  const handleViewDetails = (roadmapId) => {
    dispatch(fetchLearningRoadmapById(roadmapId));
    setShowViewModal(true);
  };

  const handleEdit = (roadmapId) => {
    dispatch(fetchLearningRoadmapById(roadmapId));
    setShowEditModal(true);
  };

  const handleDelete = (roadmapId) => {
    setDeleteConfirmationId(roadmapId); // Show custom confirmation modal
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      await dispatch(deleteLearningRoadmap(deleteConfirmationId));
      setDeleteConfirmationId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmationId(null);
  };


  const handleLike = async (roadmapId) => {
    await dispatch(likeLearningRoadmap(roadmapId));
  };

  const handleFork = async (roadmapId) => {
    await dispatch(forkLearningRoadmap(roadmapId));
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setDeleteConfirmationId(null);
    dispatch(clearCurrentRoadmap());
    dispatch(clearRoadmapError());
  };

  // --- Pagination for daily plan in view modal ---
  const totalDaysInCurrentRoadmap = currentRoadmap?.dailyPlan?.length || 0;
  const currentDayPlan = currentRoadmap?.dailyPlan?.find((plan) => plan.day === currentViewDay);

  const goToNextDay = useCallback(() => {
    setCurrentViewDay((prev) => Math.min(prev + 1, totalDaysInCurrentRoadmap));
  }, [totalDaysInCurrentRoadmap]);

  const goToPrevDay = useCallback(() => {
    setCurrentViewDay((prev) => Math.max(prev - 1, 1));
  }, []);

  // Filtered roadmaps for display (client-side filtering for search query)
  const filteredRoadmaps = roadmaps.filter((roadmap) =>
    roadmap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roadmap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roadmap.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roadmap.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );


  // --- UI Render Logic ---
  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-10">
      <Loader className="animate-spin text-primary h-8 w-8 mr-2" />
      <span className="text-lg text-foreground">Loading roadmaps...</span>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-10 text-destructive-foreground bg-destructive rounded-lg p-4 mx-auto max-w-md">
      <h3 className="text-xl font-semibold mb-2">Error!</h3>
      <p>{error}</p>
      <button onClick={clearRoadmapError} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-accent-foreground hover:text-white transition-colors">
        Clear Error
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-10 py-4 border-b border-border"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-primary accent-text mb-4 sm:mb-0">RoadManager</h1>
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white rounded-2xl px-4 py-2 flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5" /> Generate New Roadmap
          </button>
        </div>
      </motion.header>

      {/* Error Display */}
      {error && !loading && renderErrorState()}

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8 p-4 bg-card rounded-xl shadow-md border border-border flex flex-wrap gap-4 items-end"
      >
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">
            Search Roadmap:
          </label>
          <div className="relative max-w-[500px] w-full ">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              id="search"
              placeholder="Search by title, skill, tags..."
              className="w-full h-full pl-10 border border-border bg-input px-5 py-2 rounded-xl shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className=" text-center">
          <label htmlFor="filterSkill" className="block text-sm font-medium text-foreground mb-2">
            Skill:
          </label>
          <select
            id="filterSkill"
            className="bg-input border border-border px-3 py-1 rounded"
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
          >
            <option value="">All Skills</option>
            {/* You can dynamically populate skills from your database or a predefined list */}
            <option value="MernStack">MERN Stack</option>
            <option value="React">React</option>
            <option value="Node.js">Node.js</option>
            <option value="Python">Python</option>
          </select>
        </div>

        <div className="text-center">
          <label htmlFor="filterSkillLevel" className="block text-sm font-medium text-foreground mb-1">
            Level:
          </label>
          <select
            id="filterSkillLevel"
            className="bg-input border border-border px-3 py-1 rounded"
            value={filterSkillLevel}
            onChange={(e) => setFilterSkillLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="text-center">
          <label htmlFor="filterStatus" className="block text-sm font-medium text-foreground mb-1">
            Status:
          </label>
          <select
            id="filterStatus"
            className="bg-input border border-border px-3 py-1 rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          onClick={() => {
            setFilterSkill('');
            setFilterSkillLevel('');
            setFilterStatus('');
            setSearchQuery('');
          }}
          className="bg-secondary px-4 py-2 text-primary rounded flex items-center gap-2"
        >
          <Filter className="h-4 w-4" /> Clear Filters
        </button>
      </motion.div>

      {/* Roadmap List */}
      <h2 className="text-3xl font-heading mb-6 text-foreground">My Learning Roadmaps</h2>
      {loading && filteredRoadmaps.length === 0 ? (
        renderLoadingState()
      ) : filteredRoadmaps.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg py-10 card-style">
          No roadmaps match your criteria. Try adjusting filters or generate a new one!
        </p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredRoadmaps.map((roadmap) => (
              <motion.div
                key={roadmap._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="card-style flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-2xl font-heading mb-2 text-primary leading-tight">{roadmap.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {roadmap.description}
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm mb-4 text-custom">
                    <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent-foreground" /> {roadmap.skill}</span>
                    <span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-accent-foreground" /> {roadmap.skillLevel}</span>
                    <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent-foreground" /> {roadmap.totalDurationDays} Days</span>
                    <span className="flex items-center gap-2"><FaUserCircle className="h-4 w-4 text-accent-foreground" /> {roadmap.owner?.username || 'Unknown'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {roadmap.tags.map((tag, index) => (
                      <span key={index} className="bg-accent text-accent-foreground text-xs px-2.5 py-1 rounded-full border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {roadmap.viewsCount}</span>
                    <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {roadmap.likesCount}</span>
                    <span className="flex items-center gap-1"><GitFork className="h-4 w-4" /> {roadmap.forksCount}</span>
                    <span className={`flex items-center gap-1 ml-auto px-2 py-1 rounded-full text-xs font-medium
                                     ${roadmap.status === 'published' ? 'bg-primary/20 text-primary' :
                                       roadmap.status === 'draft' ? 'bg-secondary text-secondary-foreground' :
                                       'bg-muted-foreground/20 text-muted-foreground'}`}>
                      <Layers className="h-3 w-3" /> {roadmap.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6 border-t border-border pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewDetails(roadmap._id)}
                    className="bg-secondary px-4 py-1 text-primary rounded"
                    aria-label={`View details for ${roadmap.title}`}
                  >
                    View
                  </motion.button>
                  {/* Conditional rendering for owner actions */}
                  {userId && roadmap.owner?._id === userId && ( // Check if current user is the owner
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(roadmap._id)}
                        className="bg-secondary px-4 py-1 text-primary rounded"
                        aria-label={`Edit ${roadmap.title}`}
                      >
                        <Edit className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(roadmap._id)}
                        className="bg-secondary px-4 py-1   rounded text-destructive  hover:bg-destructive hover:text-white"
                        aria-label={`Delete ${roadmap.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </>
                  )}
                  {userId && roadmap.owner?._id !== userId && ( // Show like/fork if not owner
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLike(roadmap._id)}
                        className="bg-secondary px-4 py-1 text-primary rounded"
                        aria-label={`Like ${roadmap.title}`}
                      >
                        <Heart className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFork(roadmap._id)}
                        className="bg-secondary px-4 py-1 text-primary rounded"
                        aria-label={`Fork ${roadmap.title}`}
                      >
                        <GitFork className="h-4 w-4" />
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* --- Create Roadmap Modal --- */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-card p-6 rounded-xl shadow-2xl max-w-lg w-full custom-scrollbar max-h-[90vh] overflow-y-auto border border-primary"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading text-primary">Generate New Learning Roadmap</h2>
                <button onClick={closeModals} className="btn-icon">
                  <X className="h-6 w-6" />
                </button>
              </div>
              {loading ? (
                renderLoadingState()
              ) : (
                <form onSubmit={handleCreateSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="skill" className="block text-sm font-medium text-foreground mb-1">
                      Skill:
                    </label>
                    <input
                      type="text"
                      id="skill"
                      name="skill"
                      value={newRoadmapData.skill}
                      onChange={handleNewRoadmapChange}
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                      placeholder="e.g., React Development"
                    />
                  </div>
                  <div>
                    <label htmlFor="skillLevel" className="block text-sm font-medium text-foreground mb-1">
                      Skill Level:
                    </label>
                    <select
                      id="skillLevel"
                      name="skillLevel"
                      value={newRoadmapData.skillLevel}
                      onChange={handleNewRoadmapChange}
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="totalDurationDays" className="block text-sm font-medium text-foreground mb-1">
                      Total Duration (Days):
                    </label>
                    <input
                      type="number"
                      id="totalDurationDays"
                      name="totalDurationDays"
                      value={newRoadmapData.totalDurationDays}
                      onChange={handleNewRoadmapChange}
                      min="1"
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="bg-primary text-white rounded-2xl px-4 py-2 w-full flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    {loading ? 'Generating...' : 'Generate Roadmap'}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- View Roadmap Modal --- */}
      <AnimatePresence>
        {showViewModal && currentRoadmap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-card p-6 rounded-xl shadow-2xl max-w-4xl w-full custom-scrollbar max-h-[90vh] overflow-y-auto relative border border-primary"
            >
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-card pb-2 z-10 border-b border-border">
                <h2 className="text-3xl font-heading text-primary">{currentRoadmap.title}</h2>
                <button onClick={closeModals} className="btn-icon">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {loading ? (
                renderLoadingState()
              ) : (
                <>
                  <div className="text-foreground leading-relaxed mb-6">
                    <HtmlRenderer htmlContent={currentRoadmap.description} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-sm mt-4 mb-6 text-custom border-b border-border pb-4">
                    <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent-foreground" /> {currentRoadmap.skill}</span>
                    <span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-accent-foreground" /> {currentRoadmap.skillLevel}</span>
                    <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent-foreground" /> {currentRoadmap.totalDurationDays} Days</span>
                    <span className="flex items-center gap-2"><FaUserCircle className="h-4 w-4 text-accent-foreground" /> {currentRoadmap.owner?.username || 'Unknown'}</span>
                    <span className="flex items-center gap-2"><Layers className="h-4 w-4 text-accent-foreground" /> {currentRoadmap.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
                    {currentRoadmap.tags.map((tag, index) => (
                      <span key={index} className="bg-accent text-accent-foreground text-xs px-2.5 py-1 rounded-full border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Daily Plan Navigation */}
                  <div className="flex justify-between items-center bg-muted p-3 rounded-md mb-4 sticky top-[80px] z-10 shadow-sm border border-border">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToPrevDay}
                      disabled={currentViewDay === 1}
                      className="bg-primary px-4 py-2 text-white rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" /> <span className='hidden md:block'>Previous Day</span>
                    </motion.button>
                    <span className="font-semibold text-sm md:[20px] text-foreground">
                      Day {currentViewDay} of {totalDaysInCurrentRoadmap}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToNextDay}
                      disabled={currentViewDay === totalDaysInCurrentRoadmap}
                      className="bg-primary px-4 py-2 text-white rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                     <span className='hidden md:block'> Next Day</span> <ChevronRight className="h-4 w-4" />
                    </motion.button>
                  </div>

                  {/* Current Day's Activities */}
                  {currentDayPlan ? (
                    <motion.div
                      key={currentViewDay} // Key change for re-animation on day change
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {currentDayPlan.activities.length > 0 ? (
                        currentDayPlan.activities.map((activity, index) => (
                          <div key={index} className="bg-secondary p-4 rounded-lg border border-border shadow-sm">
                            <h4 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" /> {activity.title}
                              {activity.isCompleted && <Star className="h-4 w-4 text-yellow-500 ml-2" />}
                            </h4>
                            <div className="text-muted-foreground mb-3 text-base">
                              <HtmlRenderer htmlContent={activity.description} />
                            </div>
                            {activity.resources && activity.resources.length > 0 && (
                              <div className="mt-3">
                                <h5 className="font-semibold text-custom mb-2 flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-accent-foreground" /> Resources:
                                </h5>
                                <ul className="list-none pl-0 space-y-2 overflow-hidden">
                                  {activity.resources.map((resource, resIndex) => (
                                    <li key={resIndex} className="text-sm text-foreground bg-muted p-2 rounded-md border border-border flex items-center">
                                      {/* Simplified rendering: HtmlRenderer now handles plain URLs, <img>, and <a> */}
                                      <HtmlRenderer htmlContent={resource} />
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No activities planned for this day.</p>
                      )}
                    </motion.div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No plan available for this day.</p>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Edit Roadmap Modal --- */}
      <AnimatePresence>
        {showEditModal && currentRoadmap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-card p-6 rounded-xl shadow-2xl max-w-lg w-full custom-scrollbar max-h-[90vh] overflow-y-auto border border-primary"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading text-primary">Edit Learning Roadmap</h2>
                <button onClick={closeModals} className="btn-icon">
                  <X className="h-6 w-6" />
                </button>
              </div>
              {loading ? (
                renderLoadingState()
              ) : (
                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="editTitle" className="block text-sm font-medium text-foreground mb-1">
                      Title:
                    </label>
                    <input
                      type="text"
                      id="editTitle"
                      name="title"
                      value={editRoadmapData.title}
                      onChange={handleEditRoadmapChange}
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="editDescription" className="block text-sm font-medium text-foreground mb-1">
                      Description:
                    </label>
                    <textarea
                      id="editDescription"
                      name="description"
                      value={editRoadmapData.description}
                      onChange={handleEditRoadmapChange}
                      rows="4"
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                    ></textarea>
                  </div>
                  <div>
                    <label htmlFor="editSkill" className="block text-sm font-medium text-foreground mb-1">
                      Skill:
                    </label>
                    <input
                      type="text"
                      id="editSkill"
                      name="skill"
                      value={editRoadmapData.skill}
                      onChange={handleEditRoadmapChange}
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="editSkillLevel" className="block text-sm font-medium text-foreground mb-1">
                      Skill Level:
                    </label>
                    <select
                      id="editSkillLevel"
                      name="skillLevel"
                      value={editRoadmapData.skillLevel}
                      onChange={handleEditRoadmapChange}
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="editTotalDurationDays" className="block text-sm font-medium text-foreground mb-1">
                      Total Duration (Days):
                    </label>
                    <input
                      type="number"
                      id="editTotalDurationDays"
                      name="totalDurationDays"
                      value={editRoadmapData.totalDurationDays}
                      onChange={handleEditRoadmapChange}
                      min="1"
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="editTags" className="block text-sm font-medium text-foreground mb-1">
                      Tags (comma-separated):
                    </label>
                    <input
                      type="text"
                      id="editTags"
                      name="tags"
                      value={editRoadmapData.tags.join(', ')}
                      onChange={(e) =>
                        setEditRoadmapData((prev) => ({
                          ...prev,
                          tags: e.target.value.split(',').map((tag) => tag.trim()),
                        }))
                      }
                      className="bg-input border border-border px-3 py-1 rounded"
                      placeholder="e.g., javascript, webdev, frontend"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsPublic"
                      name="isPublic"
                      checked={editRoadmapData.isPublic}
                      onChange={handleEditRoadmapChange}
                      className="form-checkbox h-4 w-4 text-primary rounded"
                    />
                    <label htmlFor="editIsPublic" className="text-sm font-medium text-foreground">
                      Make Public
                    </label>
                  </div>
                  <div>
                    <label htmlFor="editStatus" className="block text-sm font-medium text-foreground mb-1">
                      Status:
                    </label>
                    <select
                      id="editStatus"
                      name="status"
                      value={editRoadmapData.status}
                      onChange={handleEditRoadmapChange}
                      required
                      className="bg-input border border-border px-3 py-1 rounded"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="bg-primary text-white rounded-2xl px-4 py-2 w-full flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <Edit className="h-5 w-5" />
                    )}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Custom Delete Confirmation Modal --- */}
      <AnimatePresence>
        {deleteConfirmationId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-card p-6 rounded-xl shadow-2xl max-w-sm w-full border border-destructive"
            >
              <h3 className="text-xl font-heading text-destructive mb-4">Confirm Deletion</h3>
              <p className="text-foreground mb-6">Are you sure you want to delete this roadmap? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cancelDelete}
                  className="bg-secondary px-4 py-1 text-primary rounded"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmDelete}
                  className="bg-primary text-white rounded-2xl px-4 py-2 bg-destructive hover:bg-destructive-foreground"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoadManager;