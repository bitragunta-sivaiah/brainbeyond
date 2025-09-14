import React from 'react';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    fetchPurchaseHistory,
    fetchUserHistory,
    fetchSubscriptionHistory,
    fetchResumeHistory,
    fetchInterviewHistory,
    fetchCoursesHistory
} from '../store/redux/adminHistorySlice'; // Adjust the import path to your slice
import API from '../api/api'; // Adjust the import path for your API instance

// --- Icons ---
import { FaUsers, FaShoppingCart, FaHistory, FaFileAlt, FaVideo, FaBookOpen } from 'react-icons/fa';
import { Download, RefreshCw, AlertTriangle, Info } from 'lucide-react';

// --- Reusable UI Components ---

const Spinner = () => (
    <div className="flex items-center justify-center p-16">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full"
        />
    </div>
);

const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/50 rounded-lg border border-dashed border-border">
        <Info className="w-12 h-12 mb-4 text-custom" />
        <h3 className="text-xl font-semibold text-foreground">No Data Available</h3>
        <p className="mt-1 text-custom">{message}</p>
    </div>
);

const ErrorState = ({ error, onRetry }) => (
    <div className="flex flex-col items-center justify-center p-16 text-center bg-destructive/10 text-destructive rounded-lg border border-dashed border-destructive/50">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold">An Error Occurred</h3>
        <p className="mt-1 max-w-md">{error}</p>
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md shadow hover:bg-destructive/90 transition-colors"
        >
            <RefreshCw size={16} />
            Try Again
        </motion.button>
    </div>
);

const DataTable = ({ title, data, columns, loading, error, onRefresh, onExport }) => {
    return (
        <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-xl shadow-md overflow-hidden"
        >
            <header className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onRefresh}
                        disabled={loading}
                        className="p-2 text-custom hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onExport}
                        disabled={loading || !data || data.length === 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                    >
                        <Download size={16} />
                        Export
                    </motion.button>
                </div>
            </header>
            <div className="p-2">
                {loading ? (
                    <Spinner />
                ) : error ? (
                    <ErrorState error={error} onRetry={onRefresh} />
                ) : !data || data.length === 0 ? (
                    <EmptyState message="There are no records to display for this category yet." />
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    {columns.map((col) => (
                                        <th key={col.accessorKey} className="px-4 py-3 text-left text-xs font-semibold text-custom uppercase tracking-wider">
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {data.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-muted/50 transition-colors">
                                        {columns.map((col) => (
                                            <td key={col.accessorKey} className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                                {row[col.accessorKey]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// --- Static Tab Configuration ---
// Defined outside the component to prevent re-creation on every render.
const HISTORY_TABS_CONFIG = {
    purchaseHistory: {
        label: "Purchase History",
        icon: FaShoppingCart,
        fetchAction: fetchPurchaseHistory,
        endpoint: '/purchase-history',
        columns: [
            { header: "User", accessorKey: "userName" },
            { header: "Item Name", accessorKey: "itemName" },
            { header: "Item Type", accessorKey: "itemType" },
            { header: "Order Date", accessorKey: "orderDate" },
            { header: "Billing Cycle", accessorKey: "billingCycle" },
            { header: "Progress", accessorKey: "courseProgress" },
            { header: "Payment ID", accessorKey: "paymentId" },
        ]
    },
    userHistory: {
        label: "User History",
        icon: FaUsers,
        fetchAction: fetchUserHistory,
        endpoint: '/user-history',
        columns: [
            { header: "Username", accessorKey: "username" },
            { header: "Role", accessorKey: "role" },
            { header: "Verified", accessorKey: "isVerified" },
            { header: "Active Sub", accessorKey: "hasValidSubscription" },
            { header: "Sub End Date", accessorKey: "subscriptionEndDate" },
            { header: "Courses Bought", accessorKey: "coursesPurchased" },
        ]
    },
    subscriptionHistory: {
        label: "Subscription History",
        icon: FaHistory,
        fetchAction: fetchSubscriptionHistory,
        endpoint: '/subscription-history',
        columns: [
            { header: "Package", accessorKey: "packageName" },
            { header: "Amount", accessorKey: "amount" },
            { header: "Total Purchasers", accessorKey: "totalPurchasers" },
            { header: "Current Subscribers", accessorKey: "currentSubscribers" },
            { header: "Total Revenue", accessorKey: "totalRevenue" },
        ]
    },
    resumeHistory: {
        label: "Resume Builder",
        icon: FaFileAlt,
        fetchAction: fetchResumeHistory,
        endpoint: '/resume-builder-history',
        columns: [
            { header: "Username", accessorKey: "userName" },
            { header: "Resumes Today", accessorKey: "todayResumeUsed" },
            { header: "ATS Checks Today", accessorKey: "todayATSUsed" },
            { header: "Total Resumes", accessorKey: "totalResumeUsed" },
            { header: "Total ATS Checks", accessorKey: "totalATSUsed" },
        ]
    },
    interviewHistory: {
        label: "Interview Prep",
        icon: FaVideo,
        fetchAction: fetchInterviewHistory,
        endpoint: '/interview-preparation-history',
        columns: [
            { header: "Username", accessorKey: "userName" },
            { header: "Target Role", accessorKey: "targetRole" },
            { header: "Target Company", accessorKey: "targetCompany" },
            { header: "Start Date", accessorKey: "prepStartDate" },
            { header: "AI Mocks Today", accessorKey: "todayAIMockUsage" },
            { header: "Total AI Mocks", accessorKey: "totalAIMockUsage" },
        ]
    },
    coursesHistory: {
        label: "Courses History",
        icon: FaBookOpen,
        fetchAction: fetchCoursesHistory,
        endpoint: '/courses-history',
        columns: [
            { header: "Course Name", accessorKey: "courseName" },
            { header: "Enrolled", accessorKey: "enrolledStudents" },
            { header: "Revenue", accessorKey: "revenue" },
            { header: "Chapters", accessorKey: "chapters" },
            { header: "Lessons", accessorKey: "lessons" },
            { header: "Certificates", accessorKey: "certificatesIssued" },
        ]
    },
};

// --- Main Page Component ---

const AdminDataHistory = () => {
    const [activeTab, setActiveTab] = useState('purchaseHistory');
    const dispatch = useDispatch();

    const adminHistoryState = useSelector((state) => state.adminHistory);
    
    const activeTabConfig = HISTORY_TABS_CONFIG[activeTab];
    const activeTabState = adminHistoryState[activeTab];

    // This stable useEffect hook correctly fetches data only when needed.
    useEffect(() => {
        const currentState = adminHistoryState[activeTab];
        // Fetch only if data is not present and it's not already in a loading state.
        if (currentState && currentState.data.length === 0 && !currentState.loading) {
            dispatch(HISTORY_TABS_CONFIG[activeTab].fetchAction());
        }
    }, [activeTab, dispatch]); // Runs only when the active tab changes.

    const handleRefresh = () => {
        if (activeTabConfig) {
            dispatch(activeTabConfig.fetchAction());
        }
    };

    const handleExport = async () => {
        if (!activeTabConfig) return;
        
        const { endpoint, label } = activeTabConfig;
        const toast = (await import('react-hot-toast')).default;
        const toastId = toast.loading(`Exporting ${label}...`);

        try {
            const response = await API.get(`/admin/history${endpoint}?export=excel`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const fileName = `${label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
            
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            toast.success(`${label} exported successfully!`, { id: toastId });
            
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Export failed:", error);
            toast.error("An error occurred during export.", { id: toastId });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen"
        >
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold font-display tracking-wider text-foreground">Admin Dashboard</h1>
                    <p className="mt-2 text-lg text-custom accent-text">
                        Comprehensive Data History and Reports
                    </p>
                </header>

                <div className="mb-6">
                    <div className="border-b border-border">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto custom-scrollbar pb-1">
                           <div className="flex mb-2 gap-4 md:gap-8">
                             {Object.entries(HISTORY_TABS_CONFIG).map(([key, tab]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all
                                        ${activeTab === key
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-custom hover:border-border hover:text-foreground'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                           </div>
                        </nav>
                    </div>
                </div>

                <main>
                    <AnimatePresence mode="wait">
                        <DataTable
                            key={activeTab}
                            title={activeTabConfig.label}
                            data={activeTabState.data}
                            columns={activeTabConfig.columns}
                            loading={activeTabState.loading}
                            error={activeTabState.error}
                            onRefresh={handleRefresh}
                            onExport={handleExport}
                        />
                    </AnimatePresence>
                </main>
            </div>
        </motion.div>
    );
};

export default AdminDataHistory;