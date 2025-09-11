import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Trash2, Loader, ServerCrash, FileText, X, 
    ArrowRightCircle, PlayCircle, Search, AlertTriangle
} from 'lucide-react';
import {
    fetchPreparations,
    createPreparation,
    updatePreparation,
    deletePreparation,
    deleteBulkPreparations,
} from '../store/redux/interviewPreparationSlice'; // Adjust the path as needed

// --- Helper Components ---

const Spinner = () => (
    <div className="flex justify-center items-center h-full py-16">
        <Loader className="w-12 h-12 animate-spin text-primary" />
    </div>
);

const ErrorDisplay = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full text-destructive p-6 bg-destructive/10 rounded-lg">
        <ServerCrash className="w-16 h-16 mb-4" />
        <h3 className="text-xl font-heading mb-2">Oops! Something went wrong.</h3>
        <p className="font-body text-center">{message || "Could not process your request. Please try again later."}</p>
    </div>
);

const EmptyState = ({ onOpenModal }) => (
    <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
        <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-heading text-foreground">No Interview Plans Yet</h3>
        <p className="mt-2 font-body text-muted-foreground">Get started by creating your first preparation plan.</p>
        <div className="mt-6">
            <button
                onClick={onOpenModal}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Create New Plan
            </button>
        </div>
    </div>
);


const PreparationModal = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
    const [formData, setFormData] = useState({
        title: '',
        targetRole: '',
        targetCompany: '',
        experienceLevel: 'fresher',
    });

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                title: initialData.title || '',
                targetRole: initialData.targetRole || '',
                targetCompany: initialData.targetCompany || '',
                experienceLevel: initialData.experienceLevel || 'fresher',
            });
        } else {
            setFormData({
                title: '',
                targetRole: '',
                targetCompany: '',
                experienceLevel: 'fresher',
            });
        }
    }, [initialData, mode, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}
                    className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-lg relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-heading">{mode === 'create' ? 'Create New Plan' : 'Edit Plan'}</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-muted-foreground">Title</label>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ring focus:border-ring sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="targetRole" className="block text-sm font-medium text-muted-foreground">Target Role</label>
                                <input type="text" name="targetRole" id="targetRole" value={formData.targetRole} onChange={handleChange} required className="mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ring focus:border-ring sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="targetCompany" className="block text-sm font-medium text-muted-foreground">Target Company (Optional)</label>
                                <input type="text" name="targetCompany" id="targetCompany" value={formData.targetCompany} onChange={handleChange} className="mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ring focus:border-ring sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="experienceLevel" className="block text-sm font-medium text-muted-foreground">Experience Level</label>
                                <select name="experienceLevel" id="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ring focus:border-ring sm:text-sm">
                                    <option value="fresher">Fresher</option>
                                    <option value="1-3 years">1-3 Years</option>
                                    <option value="3-5 years">3-5 Years</option>
                                    <option value="5+ years">5+ Years</option>
                                </select>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md mr-3 hover:bg-muted">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">{mode === 'create' ? 'Create' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}
                    className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <h3 className="mt-4 text-xl font-heading">{title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
                        <div className="mt-6 flex justify-center gap-4">
                            <button onClick={onClose} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-muted">Cancel</button>
                            <button onClick={onConfirm} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">Confirm</button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const StatusBadge = ({ status }) => {
    const statusStyles = {
        'not-started': 'bg-gray-200 text-gray-800',
        'in-progress': 'bg-blue-200 text-blue-800',
        'completed': 'bg-green-200 text-green-800',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusStyles[status] || statusStyles['not-started']}`}>
            {status.replace('-', ' ')}
        </span>
    );
};


const InterviewPlanCard = ({ plan, onSelect, isSelected, onEdit, onDelete, onStartInterview }) => {
    return (
        <motion.div
            layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-lg border border-border shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition-shadow"
        >
            <div className="flex items-start">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(plan._id)}
                    className="h-5 w-5 rounded border-border text-primary focus:ring-ring mt-1"
                />
                <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-heading text-lg text-foreground">{plan.title}</h3>
                        <StatusBadge status={plan.status} />
                    </div>
                    <p className="font-body text-sm text-muted-foreground">{plan.targetRole}</p>
                    <div className="text-xs text-muted-foreground/80 mt-2 space-y-1">
                        <p>Company: {plan.targetCompany || 'Any'}</p>
                        <p>Experience: {plan.experienceLevel}</p>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex justify-end items-center space-x-1">
                <button onClick={() => onStartInterview(plan._id)} className="p-2 rounded-md hover:bg-accent text-primary" title="Start Mock Interview">
                    <PlayCircle className="w-5 h-5" />
                </button>
                <Link to={`/interview-prep/${plan._id}`} className="p-2 rounded-md hover:bg-accent text-accent-foreground" title="View Details">
                    <ArrowRightCircle className="w-5 h-5" />
                </Link>
                <button onClick={() => onEdit(plan)} className="p-2 rounded-md hover:bg-accent text-accent-foreground" title="Edit Plan">
                    <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(plan._id)} className="p-2 rounded-md hover:bg-destructive/20 text-destructive" title="Delete Plan">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
};


// --- Main Component ---
const Interview = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { preparations, isLoading, isError, message } = useSelector((state) => state.interviewPrep);

    const [selectedPlans, setSelectedPlans] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentPlanData, setCurrentPlanData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        dispatch(fetchPreparations());
    }, [dispatch]);

    const filteredPreparations = useMemo(() => {
        if (!searchTerm) return preparations;
        return preparations.filter(plan =>
            plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.targetRole.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [preparations, searchTerm]);

    const handleSelectPlan = (id) => {
        setSelectedPlans(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleOpenModal = (mode = 'create', plan = null) => {
        setModalMode(mode);
        setCurrentPlanData(plan);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleFormSubmit = (formData) => {
        if (modalMode === 'create') {
            dispatch(createPreparation(formData));
        } else {
            dispatch(updatePreparation({ id: currentPlanData._id, prepData: formData }));
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Plan?',
            message: 'Are you sure you want to delete this plan? This action is permanent.',
            onConfirm: () => {
                dispatch(deletePreparation(id));
                setConfirmModal({ isOpen: false });
            }
        });
    };

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: `Delete ${selectedPlans.length} Plans?`,
            message: 'Are you sure you want to delete all selected plans? This is irreversible.',
            onConfirm: () => {
                dispatch(deleteBulkPreparations(selectedPlans));
                setSelectedPlans([]);
                setConfirmModal({ isOpen: false });
            }
        });
    };

    const handleStartInterview = (id) => navigate(`/interview-session/${id}`);

    const renderContent = () => {
        if (isLoading && preparations.length === 0) return <Spinner />;
        if (isError) return <ErrorDisplay message={message} />;
        if (!isLoading && preparations.length === 0) return <EmptyState onOpenModal={() => handleOpenModal('create')} />;
        if (!isLoading && filteredPreparations.length === 0 && searchTerm) {
            return <div className="text-center p-8 text-muted-foreground">No plans match your search.</div>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredPreparations.map(plan => (
                        <InterviewPlanCard
                            key={plan._id}
                            plan={plan}
                            isSelected={selectedPlans.includes(plan._id)}
                            onSelect={handleSelectPlan}
                            onEdit={handleOpenModal.bind(null, 'edit')}
                            onDelete={handleDelete}
                            onStartInterview={handleStartInterview}
                        />
                    ))}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="bg-background text-foreground min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                        <h1 className="text-4xl font-display tracking-tighter">Interview Prep</h1>
                        <p className="font-body text-muted-foreground mt-1">Manage all your interview preparation plans in one place.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-transform transform hover:scale-105"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Create New Plan
                    </button>
                </header>

                <div className="mb-6 p-4 bg-card border rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by title or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-md focus:ring-ring focus:outline-none"
                        />
                    </div>
                    <AnimatePresence>
                        {selectedPlans.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-4"
                            >
                                <p className="font-semibold text-sm">{selectedPlans.length} plan(s) selected</p>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 flex items-center text-sm"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <main>
                    {renderContent()}
                </main>
            </div>

            <PreparationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
                initialData={currentPlanData}
                mode={modalMode}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </div>
    );
};

export default Interview;