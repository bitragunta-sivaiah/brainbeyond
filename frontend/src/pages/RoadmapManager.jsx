import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- Redux Thunk Imports ---
import {
  fetchMyRoadmaps,
  deleteRoadmap,
  createRoadmap,
  generateRoadmapAI,
  // updateRoadmap // This would be used in an edit form/modal
} from '../store/redux/learningRoadmapSlice'; // Adjust path as needed

// --- Icon Imports ---
import {
  Plus, Sparkles, Trash2, Edit, Eye, EyeOff, MoreVertical,
  BookCopy, AlertTriangle, X, Loader2, Send, CheckCircle,
  View
} from 'lucide-react';

//================================================================================
// 1. Reusable Modal Component
//================================================================================
const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold font-heading">{title}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

//================================================================================
// 2. AI Generation Form Component (for use inside Modal)
//================================================================================
const GenerateAIForm = ({ closeModal }) => {
    const dispatch = useDispatch();
    const { status } = useSelector((state) => state.roadmaps);
    const [formData, setFormData] = useState({
        skill: '',
        skillLevel: 'beginner',
        totalDurationDays: '7',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(generateRoadmapAI(formData)).then((result) => {
            if (result.type.endsWith('fulfilled')) {
                closeModal();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="skill" className="block text-sm font-medium mb-1">Skill/Topic</label>
                <input type="text" name="skill" id="skill" required placeholder="e.g., React, Python, Data Science" value={formData.skill} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2" />
            </div>
            <div>
                <label htmlFor="skillLevel" className="block text-sm font-medium mb-1">Skill Level</label>
                <select name="skillLevel" id="skillLevel" value={formData.skillLevel} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>
            <div>
                <label htmlFor="totalDurationDays" className="block text-sm font-medium mb-1">Duration (in days)</label>
                <input type="number" name="totalDurationDays" id="totalDurationDays" required min="1" max="90" value={formData.totalDurationDays} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2" />
            </div>
            <div className="flex justify-end pt-4">
                 <button type="submit" disabled={status === 'loading'} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity">
                    {status === 'loading' ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    Generate Roadmap
                </button>
            </div>
        </form>
    );
};

//================================================================================
// 3. Manual Creation Form Component (for use inside Modal)
//================================================================================
const CreateManualForm = ({ closeModal }) => {
    const dispatch = useDispatch();
    const { status } = useSelector((state) => state.roadmaps);
     const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        skill: '',
        skillLevel: 'beginner',
        totalDurationDays: 7,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(createRoadmap(formData)).then((result) => {
             if (result.type.endsWith('fulfilled')) {
                closeModal();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                <input type="text" name="title" id="title" required value={formData.title} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2" />
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" id="description" required rows="3" value={formData.description} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2"></textarea>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
                    <input type="text" name="category" id="category" required value={formData.category} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2" />
                </div>
                 <div>
                    <label htmlFor="skill" className="block text-sm font-medium mb-1">Main Skill</label>
                    <input type="text" name="skill" id="skill" required value={formData.skill} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2" />
                </div>
            </div>
            {/* ... add more fields as needed ... */}
             <div className="flex justify-end pt-4">
                 <button type="submit" disabled={status === 'loading'} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity">
                    {status === 'loading' ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    Create Roadmap
                </button>
            </div>
        </form>
    );
};


//================================================================================
// 4. Main Page Component
//================================================================================
const MyRoadmaps = () => {
  const dispatch = useDispatch();
  const { myRoadmaps, status, error } = useSelector((state) => state.roadmaps);

  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchMyRoadmaps());
  }, [dispatch]);

  const handleDelete = () => {
    if (roadmapToDelete) {
      dispatch(deleteRoadmap(roadmapToDelete));
      setRoadmapToDelete(null); // Close modal
    }
  };
  
  const MyRoadmapCard = ({ roadmap }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between"
    >
        <div>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className={`capitalize text-xs font-bold px-2 py-1 rounded-full ${
                        roadmap.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        roadmap.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>{roadmap.status}</span>
                    {roadmap.isPublic ? <Eye size={16} className="text-green-500" title="Public"/> : <EyeOff size={16} className="text-muted-foreground" title="Private"/>}
                </div>
                {/* A proper edit would link to a new page or open a large edit modal */}
                <div className="flex items-center gap-2">
                    <Link to={`/roadmap/${roadmap.slug}`} className="text-muted-foreground hover:text-primary">
                        <Eye size={18} />
                    </Link>
                    <button onClick={() => setRoadmapToDelete(roadmap._id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            <h3 className="text-lg font-bold font-heading mb-1 line-clamp-2">{roadmap.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">{roadmap.description}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            Created on: {new Date(roadmap.createdAt).toLocaleDateString()}
        </div>
    </motion.div>
  );


  return (
    <div className="container mx-auto px-4 py-12">
      {/* --- Modals --- */}
      <Modal isOpen={isAiModalOpen} onClose={() => setAiModalOpen(false)} title="Generate Roadmap with AI">
          <GenerateAIForm closeModal={() => setAiModalOpen(false)} />
      </Modal>
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create a New Roadmap">
          <CreateManualForm closeModal={() => setCreateModalOpen(false)} />
      </Modal>
      <Modal isOpen={!!roadmapToDelete} onClose={() => setRoadmapToDelete(null)} title="Confirm Deletion">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h3 className="mt-2 text-lg font-medium text-foreground">Are you sure?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone. All data for this roadmap will be permanently deleted.</p>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={() => setRoadmapToDelete(null)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg">Delete</button>
          </div>
      </Modal>

      {/* --- Page Header --- */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-4xl font-bold font-display text-primary tracking-tighter">My Roadmaps</h1>
        <div className="flex items-center gap-2">
            <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-muted transition-colors">
                <Plus size={18} /> Create Manually
            </button>
            <button onClick={() => setAiModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
                <Sparkles size={18} /> Generate with AI
            </button>
        </div>
      </header>
      
      {/* --- Content Grid --- */}
      <main>
        {status === 'loading' && myRoadmaps.length === 0 && <p>Loading your roadmaps...</p>}
        {status === 'failed' && <p className="text-destructive">Error: {error}</p>}
        {status === 'succeeded' && myRoadmaps.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                <BookCopy className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-xl font-semibold">No Roadmaps Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Start your learning journey by creating your first roadmap.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 <AnimatePresence>
                    {myRoadmaps.map(roadmap => <MyRoadmapCard key={roadmap._id} roadmap={roadmap} />)}
                </AnimatePresence>
            </div>
        )}
      </main>
    </div>
  );
};

export default MyRoadmaps;