import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

// --- Redux Slice Imports ---
import {
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    fetchAnalytics,
    exportAnalytics,
    selectAllPlans,
    getPlansStatus,
    getAnalyticsData,
    getAnalyticsStatus,
    getExportStatus,
} from '../../store/redux/collab/adminCollabSlice'; // Adjust the path to your slice file

// --- Icon Imports ---
import { PlusCircle, Edit, Trash2, X, Download, BarChart2, CheckCircle, Package, Users, Loader2, Info, FileJson2 } from 'lucide-react';
import { FaRupeeSign } from 'react-icons/fa';
import { toast } from 'react-hot-toast';


// --- Reusable UI Components ---

const StatCard = ({ icon, title, value, color }) => (
    <motion.div
        className="bg-card p-5 rounded-lg shadow-md flex items-center space-x-4"
        whileHover={{ y: -5, boxShadow: 'var(--shadow-md)' }}
    >
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-custom">{title}</p>
            <h3 className="text-2xl font-bold text-foreground">{value}</h3>
        </div>
    </motion.div>
);

const Loader = ({ text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center space-y-4 p-10">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-lg text-custom">{text}</p>
    </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-card p-8 rounded-xl shadow-2xl w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-2xl font-bold font-heading mb-4">{title}</h2>
                    <p className="text-custom mb-8">{message}</p>
                    <div className="flex justify-end space-x-4">
                        <button onClick={onClose} className="px-6 py-2 rounded-md bg-secondary text-secondary-foreground font-semibold hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={onConfirm} className="px-6 py-2 rounded-md bg-destructive text-destructive-foreground font-semibold hover:bg-red-700 transition-colors">Confirm</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

//==========================================================================
// CORRECTED: PlanFormModal Component
//==========================================================================
const PlanFormModal = ({ isOpen, onClose, plan }) => {
    const dispatch = useDispatch();
    const isEditing = !!plan;

    // Helper function to create the initial state from a plan object or defaults
    const getInitialState = (plan) => ({
        planName: plan?.planName || '',
        planType: plan?.planType || 'team',
        customPlanName: plan?.customPlanName || '',
        price: { monthly: plan?.price?.monthly || 0, yearly: plan?.price?.yearly || 0 },
        jobPostLimit: plan?.jobPostLimit || 5,
        teamMemberLimit: plan?.teamMemberLimit || 1,
        dailyInterviewLimit: plan?.dailyInterviewLimit || 5,
        aiFeedbackEnabled: plan?.aiFeedbackEnabled ?? true,
        advancedAnalytics: plan?.advancedAnalytics ?? false,
        supportLevel: plan?.supportLevel || 'standard',
        isRecommended: plan?.isRecommended ?? false,
        features: plan?.features || [], // **CORRECTED**: Start with an empty array
    });
    
    const [formData, setFormData] = useState(getInitialState(plan));
    const [jsonInput, setJsonInput] = useState('');
    const [showJsonInput, setShowJsonInput] = useState(false);

    useEffect(() => {
        setFormData(getInitialState(isEditing ? plan : null));
        setJsonInput('');
        setShowJsonInput(false);
    }, [plan, isEditing, isOpen]);
    
    const isCustomPlan = useMemo(() => formData.planType === 'custom', [formData.planType]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith('price.')) {
            const priceField = name.split('.')[1];
            setFormData(prev => ({ ...prev, price: { ...prev.price, [priceField]: parseFloat(value) || 0 } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    // **NEW**: Handler to add a feature to the array
    const handleAddFeature = (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            e.preventDefault();
            setFormData(prev => ({ ...prev, features: [...prev.features, e.target.value.trim()] }));
            e.target.value = '';
        }
    };

    // **NEW**: Handler to remove a feature
    const handleRemoveFeature = (indexToRemove) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter((_, index) => index !== indexToRemove) }));
    };
    
    // **NEW**: Handler to import plan data from JSON
    const handleJsonImport = () => {
        try {
            const parsedData = JSON.parse(jsonInput);
            // We can add more validation here (e.g., using a Zod schema)
            if (typeof parsedData !== 'object' || parsedData === null) {
                throw new Error("Invalid JSON structure.");
            }
            // Merge parsed data with defaults to avoid missing fields
            setFormData(prev => ({ ...getInitialState(), ...prev, ...parsedData }));
            toast.success("Plan data imported successfully!");
            setShowJsonInput(false);
            setJsonInput('');
        } catch (error) {
            toast.error(`Invalid JSON: ${error.message}`);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        
        const finalData = { ...formData };

        if (finalData.planType !== 'custom') {
            delete finalData.customPlanName; // Clean up data before sending
        }

        if (isEditing) {
            dispatch(updatePlan({ id: plan._id, updateData: finalData }));
        } else {
            dispatch(createPlan(finalData));
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8">
                             <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold font-heading">{isEditing ? 'Edit' : 'Create'} Subscription Plan</h2>
                                    <p className="text-custom mt-1">Fill the details or import from JSON.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setShowJsonInput(!showJsonInput)} className="p-2 rounded-full hover:bg-muted transition-colors text-primary" title="Import from JSON">
                                        <FileJson2 />
                                    </button>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><X /></button>
                                </div>
                            </div>

                            {/* --- JSON Input Section --- */}
                            <AnimatePresence>
                            {showJsonInput && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <label htmlFor="jsonInput" className="block text-sm font-medium text-custom mb-2">Paste plan JSON here</label>
                                        <textarea id="jsonInput" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} rows="6" className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring font-mono text-sm" placeholder='{ "planName": "My Plan", ... }' />
                                        <div className="flex justify-end mt-2">
                                            <button type="button" onClick={handleJsonImport} className="bg-primary text-primary-foreground text-sm font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                                                Apply JSON
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                            
                            {/* --- Form --- */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     <div>
                                        <label htmlFor="planName" className="block text-sm font-medium text-custom mb-1">Plan Name</label>
                                        <input type="text" name="planName" value={formData.planName} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring" required />
                                    </div>
                                    <div>
                                        <label htmlFor="planType" className="block text-sm font-medium text-custom mb-1">Plan Type</label>
                                        <select name="planType" value={formData.planType} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring">
                                            <option value="individual">Individual</option>
                                            <option value="team">Team</option>
                                            <option value="enterprise">Enterprise</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>
                                    <motion.div initial={false} animate={{ opacity: isCustomPlan ? 1 : 0.5, pointerEvents: isCustomPlan ? 'auto' : 'none' }} transition={{ duration: 0.3 }}>
                                        <label htmlFor="customPlanName" className="block text-sm font-medium text-custom mb-1">Custom Type Name</label>
                                        <input type="text" name="customPlanName" value={formData.customPlanName} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring" disabled={!isCustomPlan} required={isCustomPlan} />
                                    </motion.div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div>
                                        <label htmlFor="price.monthly" className="block text-sm font-medium text-custom mb-1">Monthly Price (₹)</label>
                                        <input type="number" name="price.monthly" value={formData.price.monthly} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring" min="0" />
                                    </div>
                                    <div>
                                        <label htmlFor="price.yearly" className="block text-sm font-medium text-custom mb-1">Yearly Price (₹)</label>
                                        <input type="number" name="price.yearly" value={formData.price.yearly} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring" min="0" />
                                    </div>
                                </div>
                                
                                {/* --- CORRECTED: Features Input --- */}
                                <div>
                                    <label htmlFor="features" className="block text-sm font-medium text-custom mb-1">Features</label>
                                    <div className="bg-input border border-border p-3 rounded-md focus-within:ring-2 focus-within:ring-ring">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.features.map((feature, index) => (
                                                <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/10 text-primary font-semibold text-sm px-3 py-1 rounded-full flex items-center gap-2">
                                                    {feature}
                                                    <button type="button" onClick={() => handleRemoveFeature(index)} className="text-primary hover:text-red-500"><X size={14} /></button>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <input type="text" id="features" onKeyDown={handleAddFeature} placeholder="Type a feature and press Enter..." className="w-full bg-transparent outline-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-custom mb-1">Job Post Limit</label>
                                        <input type="number" name="jobPostLimit" value={formData.jobPostLimit} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring" min="0" required />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-custom mb-1">Team Member Limit</label>
                                        <input type="number" name="teamMemberLimit" value={formData.teamMemberLimit} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring" min="1" required />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-custom mb-1">Daily Interview Limit</label>
                                        <input type="number" name="dailyInterviewLimit" value={formData.dailyInterviewLimit} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring" min="1" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div>
                                        <label htmlFor="supportLevel" className="block text-sm font-medium text-custom mb-1">Support Level</label>
                                        <select name="supportLevel" value={formData.supportLevel} onChange={handleChange} className="w-full bg-input border border-border p-3 rounded-md focus:ring-2 focus:ring-ring">
                                            <option value="standard">Standard</option>
                                            <option value="priority">Priority</option>
                                            <option value="dedicated">Dedicated</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-3 pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="aiFeedbackEnabled" checked={formData.aiFeedbackEnabled} onChange={handleChange} className="w-4 h-4 accent-primary" /> AI Feedback</label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="advancedAnalytics" checked={formData.advancedAnalytics} onChange={handleChange} className="w-4 h-4 accent-primary" /> Adv. Analytics</label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="isRecommended" checked={formData.isRecommended} onChange={handleChange} className="w-4 h-4 accent-primary" /> Recommended</label>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border">
                                    <button type="submit" className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-md hover:opacity-90 transition-opacity flex items-center space-x-2">
                                        <CheckCircle size={20} />
                                        <span>{isEditing ? 'Save Changes' : 'Create Plan'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// --- Main Component ---

export default function AdminCollabManager() {
    const dispatch = useDispatch();
    
    // --- State from Redux ---
    const plans = useSelector(selectAllPlans);
    const plansStatus = useSelector(getPlansStatus);
    const analyticsData = useSelector(getAnalyticsData);
    const analyticsStatus = useSelector(getAnalyticsStatus);
    const exportStatus = useSelector(getExportStatus);
    
    // --- Local Component State ---
    const [isPlanModalOpen, setPlanModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null); // For editing
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);

    // --- Fetch initial data on component mount ---
    useEffect(() => {
        if (plansStatus === 'idle') dispatch(fetchPlans());
        if (analyticsStatus === 'idle') dispatch(fetchAnalytics());
    }, [plansStatus, analyticsStatus, dispatch]);
    
    // --- Event Handlers ---
    const handleAddNewPlan = () => {
        setCurrentPlan(null);
        setPlanModalOpen(true);
    };

    const handleEditPlan = (plan) => {
        setCurrentPlan(plan);
        setPlanModalOpen(true);
    };

    const handleDeleteClick = (plan) => {
        setPlanToDelete(plan);
        setConfirmModalOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if (planToDelete) dispatch(deletePlan(planToDelete._id));
        setConfirmModalOpen(false);
        setPlanToDelete(null);
    };
    
    const handleExport = () => dispatch(exportAnalytics());

    return (
        <div className="p-4 md:p-8 bg-background min-h-screen text-foreground font-body">
            <div className="max-w-7xl mx-auto">
                {/* --- Header --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-display text-primary tracking-tighter">Collaborator Hub</h1>
                        <p className="text-lg text-custom mt-2 accent-text">Manage hiring plans and analyze performance.</p>
                    </div>
                     <button 
                        onClick={handleAddNewPlan} 
                        className="mt-4 md:mt-0 flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-transform hover:scale-105"
                    >
                        <PlusCircle size={20}/>
                        <span>Add New Plan</span>
                    </button>
                </div>

                {/* --- Stat Cards --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <StatCard icon={<Package size={24} className="text-white"/>} title="Total Plans" value={plans.length} color="bg-blue-500" />
                    <StatCard icon={<Users size={24} className="text-white"/>} title="Hiring Managers" value={analyticsData.length} color="bg-purple-500"/>
                    <StatCard icon={<BarChart2 size={24} className="text-white"/>} title="Candidates Interviewed" value={analyticsData.reduce((acc, item) => acc + item.candidatesAttempted, 0)} color="bg-teal-500"/>
                </div>

                {/* --- Section 1: Subscription Plans --- */}
                <section className="mb-12">
                    <h2 className="text-3xl font-heading font-bold mb-6">Subscription Plans</h2>
                    {plansStatus === 'loading' && <Loader text="Fetching Plans..."/>}
                    {plansStatus === 'succeeded' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence>
                                {plans.map((plan) => (
                                    <motion.div
                                        key={plan._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4 }}
                                        className="bg-card rounded-xl shadow-md p-6 flex flex-col"
                                    >
                                        <div className="flex-grow">
                                            {plan.isRecommended && (
                                                <div className="text-xs inline-block mb-2 font-bold text-purple-800 bg-purple-200 px-3 py-1 rounded-full">MOST POPULAR</div>
                                            )}
                                            <h3 className="text-2xl font-bold font-heading text-primary">{plan.planName}</h3>
                                            <p className="text-sm text-custom capitalize mb-4">{plan.planType === 'custom' ? plan.customPlanName : plan.planType}</p>
                                            <div className="my-4 flex items-baseline space-x-2">
                                                <FaRupeeSign className="text-3xl text-accent-foreground" />
                                                <span className="text-5xl font-bold text-foreground">{plan.price.monthly}</span>
                                                <span className="text-custom">/ month</span>
                                            </div>
                                            <ul className="space-y-3 my-6 text-custom">
                                                {plan.features.slice(0, 4).map((feature, i) => (
                                                    <li key={i} className="flex items-start space-x-3">
                                                        <CheckCircle className="text-green-500 w-5 h-5 flex-shrink-0 mt-1" /><span>{feature}</span>
                                                    </li>
                                                ))}
                                                {plan.features.length > 4 && <li className="text-sm italic">+ {plan.features.length - 4} more features</li>}
                                            </ul>
                                        </div>
                                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border mt-auto">
                                            <button onClick={() => handleEditPlan(plan)} className="p-2 rounded-full hover:bg-accent transition-colors text-custom hover:text-accent-foreground"><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteClick(plan)} className="p-2 rounded-full hover:bg-destructive/10 transition-colors text-destructive"><Trash2 size={18} /></button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </section>

                {/* --- Section 2: Hiring Analytics --- */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-heading font-bold">Hiring Analytics</h2>
                        <button 
                            onClick={handleExport}
                            disabled={exportStatus === 'loading'}
                            className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-md font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exportStatus === 'loading' ? <Loader2 className="animate-spin" size={20}/> : <Download size={20}/>}
                            <span>Export</span>
                        </button>
                    </div>
                     {analyticsStatus === 'loading' && <Loader text="Fetching Analytics..."/>}
                     {analyticsStatus === 'succeeded' && (
                        <div className="bg-card rounded-xl shadow-md overflow-x-auto custom-scrollbar">
                           <table className="w-full text-left">
                                <thead className="border-b border-border">
                                    <tr>
                                        {['Company', 'Team Members', 'Plans Created', 'Sessions', 'Attempted', 'Selected'].map(h => (
                                            <th key={h} className="p-4 text-sm font-semibold text-custom uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.map(item => (
                                        <tr key={item.userId} className="border-b border-border last:border-none hover:bg-muted transition-colors">
                                            <td className="p-4 font-semibold text-foreground">{item.companyName}<p className="text-xs text-custom font-normal">{item.userName}</p></td>
                                            <td className="p-4 text-center">{item.teamMemberCount}</td>
                                            <td className="p-4 text-center">{item.interviewPlansCreated}</td>
                                            <td className="p-4 text-center">{item.interviewSessionsScheduled}</td>
                                            <td className="p-4 text-center text-green-600 font-bold">{item.candidatesAttempted}</td>
                                            <td className="p-4 text-center text-blue-600 font-bold">{item.candidatesSelected}</td>
                                        </tr>
                                    ))}
                                </tbody>
                           </table>
                        </div>
                     )}
                </section>
            </div>
            
            {/* --- Modals --- */}
            <PlanFormModal isOpen={isPlanModalOpen} onClose={() => setPlanModalOpen(false)} plan={currentPlan} />
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the plan "${planToDelete?.planName}"? This action cannot be undone.`}
            />
        </div>
    );
}