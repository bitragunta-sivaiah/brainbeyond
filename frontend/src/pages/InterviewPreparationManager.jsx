import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Briefcase, Calendar, Building, X, Loader } from 'lucide-react';
import { FaCrown } from 'react-icons/fa';

import {
    getPreparations,
    createPreparation,
    deletePreparation,
} from '../store/redux/interviewPreparationSlice'; // Assuming this path is correct
import { Link } from 'react-router-dom';

// Helper component for styled input fields
const FormInput = ({ id, label, type = 'text', value, onChange, required = false, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
            {label}
        </label>
        <input
            id={id}
            name={id}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full px-4 py-2 bg-input border border-border rounded-md focus:ring-2 focus:ring-ring focus:outline-none transition-shadow"
        />
    </div>
);

// Modal component for creating a new preparation plan
const CreatePrepModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        role: '',
        targetDate: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submissionData = {
            title: formData.title,
            target: {
                company: formData.company,
                role: formData.role,
            },
            targetDate: formData.targetDate,
        };
        onSubmit(submissionData);
        // Reset form after submission
        setFormData({ title: '', company: '', role: '', targetDate: '' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-card rounded-lg shadow-shadow-md w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-heading text-foreground">Create New Prep Plan</h2>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-muted-foreground mb-6 font-body">
                            Provide the core details and our AI will craft a personalized study guide for you.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <FormInput id="title" label="Plan Title" value={formData.title} onChange={handleChange} required placeholder="e.g., Google SWE Interview" />
                            <FormInput id="company" label="Company" value={formData.company} onChange={handleChange} required placeholder="e.g., Google" />
                            <FormInput id="role" label="Role" value={formData.role} onChange={handleChange} required placeholder="e.g., Software Engineer" />
                            <FormInput id="targetDate" label="Target Date" type="date" value={formData.targetDate} onChange={handleChange} />
                            <div className="flex justify-end gap-4 pt-4">
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onClose} className="px-6 py-2 rounded-md bg-secondary text-secondary-foreground font-semibold">
                                    Cancel
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-semibold shadow-shadow">
                                    Create Plan
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Modal for confirming deletion
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-card rounded-lg shadow-shadow-md w-full max-w-sm p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 className="text-xl font-heading text-foreground mb-2">{title}</h3>
                    <div className="text-muted-foreground mb-6 font-body">{children}</div>
                    <div className="flex justify-end gap-4">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onClose} className="px-6 py-2 rounded-md bg-secondary text-secondary-foreground font-semibold">
                            Cancel
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onConfirm} className="px-6 py-2 rounded-md bg-destructive text-destructive-foreground font-semibold shadow-shadow">
                            Delete
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);


// Card component for displaying a single preparation plan
const PreparationCard = ({ preparation, onDelete }) => {
    const daysRemaining = () => {
        if (!preparation.targetDate) return null;
        const today = new Date();
        const target = new Date(preparation.targetDate);
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        if (diffTime < 0) return { text: "Date Passed", color: "text-red-500" };
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return { text: "Today!", color: "text-blue-500" };
        return { text: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`, color: "text-green-500" };
    };

    const remaining = daysRemaining();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="bg-card rounded-lg shadow-shadow p-6 border border-border flex flex-col"
        >
            <div className="flex-grow">
                <h3 className="text-xl font-bold font-heading text-card-foreground mb-2">{preparation.title}</h3>
                <div className="flex items-center gap-3 text-muted-foreground mb-1">
                    <Building size={16} />
                    <span className="font-medium">{preparation.target.company}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Briefcase size={16} />
                    <span className="font-medium">{preparation.target.role}</span>
                </div>
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
                {remaining ? (
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className={remaining.color} />
                        <span className={`font-semibold ${remaining.color}`}>{remaining.text}</span>
                    </div>
                ) : <div></div>}
                <Link to={`/interview-prep/${preparation._id}`} className="text-sm text-primary hover:text-accent-foreground hover:underline font-medium transition-colors">
                    Get Details
                </Link>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(preparation._id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                >
                    <Trash2 size={20} />
                </motion.button>
            </div>
        </motion.div>
    );
};

// Main component page
export default function InterviewPreparePage() {
    const dispatch = useDispatch();
    const { preparations, status } = useSelector((state) => state.interview);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [prepToDelete, setPrepToDelete] = useState(null);


    useEffect(() => {
        dispatch(getPreparations());
    }, [dispatch]);

    const handleCreatePreparation = (prepData) => {
        dispatch(createPreparation(prepData));
        setIsCreateModalOpen(false);
    };

    const promptDeletePreparation = (id) => {
        const prep = preparations.find(p => p._id === id);
        if (prep) {
            setPrepToDelete(prep);
            setIsConfirmModalOpen(true);
        }
    };

    const handleConfirmDelete = () => {
        if (prepToDelete) {
            dispatch(deletePreparation(prepToDelete._id));
            setIsConfirmModalOpen(false);
            setPrepToDelete(null);
        }
    };

    return (
        <div className="bg-background min-h-screen text-foreground p-4 sm:p-6 lg:p-8 font-body">
            <CreatePrepModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreatePreparation}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Plan?"
            >
                <p>Are you sure you want to delete the plan for <strong>{prepToDelete?.title}</strong>? This action cannot be undone.</p>
            </ConfirmationModal>

            <header className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <FaCrown className="text-primary text-4xl" />
                    <h1 className="text-5xl font-display tracking-tighter">AI Interview Prep</h1>
                </div>
                <p className="text-lg text-custom font-accent">
                    Your personalized career co-pilot. Let's get you hired.
                </p>
            </header>

            <div className="mb-8">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-shadow-md hover:opacity-90 transition-opacity"
                >
                    <Plus size={20} />
                    Create New Plan
                </motion.button>
            </div>

            <div>
                <h2 className="text-3xl font-heading mb-6">My Preparation Plans</h2>
                {status === 'loading' && preparations.length === 0 ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader size={48} className="animate-spin text-primary" />
                    </div>
                ) : preparations.length > 0 ? (
                    <AnimatePresence>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {preparations.map((prep) => (
                                <PreparationCard
                                    key={prep._id}
                                    preparation={prep}
                                    onDelete={promptDeletePreparation}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-16 px-6 bg-card rounded-lg border-2 border-dashed border-border">
                        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No plans yet!</h3>
                        <p className="text-custom mb-4">Click "Create New Plan" to get started with your first AI-powered interview preparation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}