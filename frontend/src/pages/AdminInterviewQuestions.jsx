import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, Edit, Filter, Search, X, LoaderCircle } from 'lucide-react';

// Import the necessary thunks from your slice
import {
    fetchAdminQuestions,
    createAdminQuestion,
    updateAdminQuestion,
    deleteBulkAdminQuestions,
} from '../store/redux/interviewPreparationSlice'; // Adjust the import path

// Helper hook for debouncing
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const AdminInterviewQuestions = () => {
    const dispatch = useDispatch();
    const { adminQuestions, isLoading } = useSelector((state) => state.interviewPrep);

    // --- Component State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null); // null for new, object for edit
    const [selectedIds, setSelectedIds] = useState([]);
    const [filters, setFilters] = useState({ company: '', role: '' });
    
    const debouncedFilters = useDebounce(filters, 500);

    // --- Data Fetching ---
    useEffect(() => {
        dispatch(fetchAdminQuestions({ 
            company: debouncedFilters.company || undefined, 
            role: debouncedFilters.role || undefined 
        }));
    }, [dispatch, debouncedFilters]);

    // --- Memoized Values ---
    const isAllSelected = useMemo(() => 
        adminQuestions.length > 0 && selectedIds.length === adminQuestions.length,
        [adminQuestions, selectedIds]
    );

    // --- Event Handlers ---
    const handleOpenModal = (question = null) => {
        setCurrentQuestion(question);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentQuestion(null);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(adminQuestions.map(q => q._id));
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length > 0) {
            dispatch(deleteBulkAdminQuestions(selectedIds)).then(() => {
                setSelectedIds([]);
            });
        }
    };

    // --- JSX ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen font-body">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-display text-primary tracking-tighter">
                        Admin Question Bank
                    </h1>
                    <p className="text-custom mt-2 text-lg">
                        Create, manage, and curate interview questions for mock interviews.
                    </p>
                </header>

                {/* Toolbar */}
                <div className="mb-6 p-4 bg-card border border-border rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                         <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-custom" />
                            <input
                                type="text"
                                name="company"
                                placeholder="Filter by company..."
                                value={filters.company}
                                onChange={handleFilterChange}
                                className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                         <div className="relative w-full sm:w-64">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-custom" />
                            <input
                                type="text"
                                name="role"
                                placeholder="Filter by role..."
                                value={filters.role}
                                onChange={handleFilterChange}
                                className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {selectedIds.length > 0 && (
                             <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md shadow-sm hover:bg-destructive/90 transition-colors"
                            >
                                <Trash2 size={18} />
                                <span>Delete ({selectedIds.length})</span>
                            </motion.button>
                        )}
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
                        >
                            <PlusCircle size={18} />
                            <span>Add Question</span>
                        </button>
                    </div>
                </div>

                {/* Questions Table */}
                <div className="bg-card border border-border rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted border-b border-border">
                                <tr>
                                    <th className="p-4 w-12 text-center">
                                        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="accent-primary" />
                                    </th>
                                    <th className="p-4 font-heading">Question</th>
                                    <th className="p-4 font-heading">Company</th>
                                    <th className="p-4 font-heading">Role</th>
                                    <th className="p-4 font-heading">Difficulty</th>
                                    <th className="p-4 font-heading text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan="6" className="text-center p-8">
                                            <div className="flex justify-center items-center gap-3 text-custom">
                                                <LoaderCircle className="animate-spin" size={24} />
                                                <span className="text-lg">Loading Questions...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && adminQuestions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center p-8 text-custom text-lg">
                                            No questions found. Try adjusting your filters or add a new question!
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && adminQuestions.map((q) => (
                                    <motion.tr 
                                        key={q._id} 
                                        className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        layout
                                    >
                                        <td className="p-4 text-center">
                                            <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={() => handleSelectOne(q._id)} className="accent-primary" />
                                        </td>
                                        <td className="p-4 max-w-md truncate">{q.question}</td>
                                        <td className="p-4 text-custom">{q.targetCompany}</td>
                                        <td className="p-4 text-custom">{q.targetRole}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize
                                                ${q.difficulty === 'easy' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}
                                                ${q.difficulty === 'medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}
                                                ${q.difficulty === 'hard' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                                            `}>
                                                {q.difficulty}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-center items-center gap-3">
                                            <button onClick={() => handleOpenModal(q)} className="text-accent-foreground hover:text-primary transition-colors"><Edit size={20} /></button>
                                            <button onClick={() => dispatch(deleteBulkAdminQuestions([q._id]))} className="text-custom hover:text-destructive transition-colors"><Trash2 size={20} /></button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <QuestionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                questionData={currentQuestion}
            />
        </div>
    );
};

// --- Modal Sub-component ---
const QuestionModal = ({ isOpen, onClose, questionData }) => {
    const dispatch = useDispatch();
    const isEditing = !!questionData;
    const [formData, setFormData] = useState({
        question: '',
        targetCompany: 'General',
        targetRole: 'General',
        difficulty: 'medium',
        topicsCovered: '', // Stored as comma-separated string in form
    });

    useEffect(() => {
        if (isEditing) {
            setFormData({
                question: questionData.question || '',
                targetCompany: questionData.targetCompany || 'General',
                targetRole: questionData.targetRole || 'General',
                difficulty: questionData.difficulty || 'medium',
                topicsCovered: (questionData.topicsCovered || []).join(', '),
            });
        } else {
             setFormData({
                question: '', targetCompany: 'General', targetRole: 'General',
                difficulty: 'medium', topicsCovered: '',
            });
        }
    }, [questionData, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalData = {
            ...formData,
            topicsCovered: formData.topicsCovered.split(',').map(t => t.trim()).filter(Boolean),
        };

        if (isEditing) {
            dispatch(updateAdminQuestion({ questionId: questionData._id, questionData: finalData }));
        } else {
            dispatch(createAdminQuestion(finalData));
        }
        onClose();
    };
    
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 50 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } },
        exit: { opacity: 0, scale: 0.9, y: 50, transition: { duration: 0.2 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className="bg-card rounded-lg shadow-xl w-full max-w-2xl border border-border"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()} // Prevent closing on modal content click
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-2xl font-heading text-primary">
                                {isEditing ? 'Edit Question' : 'Add New Question'}
                            </h2>
                            <button onClick={onClose} className="text-custom hover:text-foreground"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block mb-1 font-semibold">Question</label>
                                <textarea name="question" value={formData.question} onChange={handleChange} required rows="4" className="w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-semibold">Target Company</label>
                                    <input type="text" name="targetCompany" value={formData.targetCompany} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold">Target Role</label>
                                    <input type="text" name="targetRole" value={formData.targetRole} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" />
                                </div>
                            </div>
                             <div>
                                <label className="block mb-1 font-semibold">Difficulty</label>
                                <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none">
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                             <div>
                                <label className="block mb-1 font-semibold">Topics Covered (comma-separated)</label>
                                <input type="text" name="topicsCovered" value={formData.topicsCovered} onChange={handleChange} placeholder="e.g., React Hooks, State Management" className="w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                                    {isEditing ? 'Save Changes' : 'Create Question'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AdminInterviewQuestions;