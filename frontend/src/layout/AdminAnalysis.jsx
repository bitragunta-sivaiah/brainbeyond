import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import {
    Users,
    BookOpen,
    Monitor,
    Newspaper,
    Tag,
    MessageCircle,
    Mail,
    ThumbsUp,
    Ticket,
    DollarSign,
    Gift,
    Eye,
    Calendar,
    MousePointer,
    CircleDot,
    ArrowRight,
    FileText,
} from 'lucide-react';
import {
    FaChalkboardTeacher,
    FaUserGraduate,
    FaBlog,
    FaQuestionCircle
} from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';
import { MdOutlineLocalOffer, MdViewStream } from 'react-icons/md';
import { BsCardChecklist } from 'react-icons/bs';
import { fetchAdminDashboard, exportData } from '../store/redux/analysisSlice';

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const { data, loading, error } = useSelector((state) => state.dashboard.admin);
    const { loading: exportLoading } = useSelector((state) => state.dashboard.export);

    useEffect(() => {
        dispatch(fetchAdminDashboard('monthly'));
    }, [dispatch]);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const handleExportCourses = () => {
        const courseIds = data?.trends?.mostEnrolledCourses?.map(course => course._id) ?? [];
        dispatch(exportData({ dataType: 'courses', ids: courseIds }));
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-lg">Loading dashboard data...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">Error: {error}</div>;
    }

    if (!data) {
        return <div className="flex items-center justify-center min-h-screen text-lg">No data available.</div>;
    }

    const { summary, financials, trends, operations, marketing, calendar } = data;

    const totalSales = parseFloat(financials?.currentPeriod?.totalSales?.$numberDecimal) || 0;
    const totalDiscounts = parseFloat(financials?.currentPeriod?.totalDiscounts?.$numberDecimal) || 0;
    const orderCount = financials?.currentPeriod?.orderCount ?? 0;
    const adClicks = operations?.adPerformance?.totalClicks ?? 0;
    const adImpressions = operations?.adPerformance?.totalImpressions ?? 0;

    const getPieChartData = (ticketStats) => {
        return ticketStats?.map(stat => ({
            id: stat._id,
            label: stat._id,
            value: stat.count,
        })) ?? [];
    };

    const getBarChartData = (revenueByMonth) => {
        return revenueByMonth?.map(item => ({
            month: item._id,
            revenue: parseFloat(item.total?.$numberDecimal) || 0,
        })) ?? [];
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatPercentage = (numerator, denominator) => {
        if (denominator === 0) return '0%';
        const percentage = (numerator / denominator) * 100;
        return `${percentage.toFixed(2)}%`;
    };

    return (
        <motion.div
            className="p-8 bg-background text-foreground min-h-screen"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold text-primary tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Comprehensive overview of platform analytics and operations.</p>
                </div>
                <button
                    onClick={handleExportCourses}
                    className="bg-primary hover:bg-primary-600 transition-colors text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                    disabled={exportLoading}
                >
                    {exportLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Exporting...
                        </>
                    ) : (
                        <>
                            <FileText size={20} />
                            Export Courses
                        </>
                    )}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                    className="bg-card p-6 rounded-2xl shadow-md border border-border flex items-start space-x-4"
                    variants={cardVariants}
                >
                    <div className="p-3 bg-secondary rounded-full">
                        <FaUserGraduate className="text-primary" size={24} />
                    </div>
                    <div>
                        <p className="text-muted-foreground font-medium text-sm">Total Students</p>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{summary?.totalStudents ?? 0}</h2>
                    </div>
                </motion.div>
                <motion.div
                    className="bg-card p-6 rounded-2xl shadow-md border border-border flex items-start space-x-4"
                    variants={cardVariants}
                >
                    <div className="p-3 bg-secondary rounded-full">
                        <FaChalkboardTeacher className="text-primary" size={24} />
                    </div>
                    <div>
                        <p className="text-muted-foreground font-medium text-sm">Total Instructors</p>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{summary?.totalInstructors ?? 0}</h2>
                    </div>
                </motion.div>
                <motion.div
                    className="bg-card p-6 rounded-2xl shadow-md border border-border flex items-start space-x-4"
                    variants={cardVariants}
                >
                    <div className="p-3 bg-secondary rounded-full">
                        <BookOpen className="text-primary" size={24} />
                    </div>
                    <div>
                        <p className="text-muted-foreground font-medium text-sm">Total Courses</p>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{summary?.totalCourses ?? 0}</h2>
                    </div>
                </motion.div>
                <motion.div
                    className="bg-card p-6 rounded-2xl shadow-md border border-border flex items-start space-x-4"
                    variants={cardVariants}
                >
                    <div className="p-3 bg-secondary rounded-full">
                        <GiReceiveMoney className="text-primary" size={24} />
                    </div>
                    <div>
                        <p className="text-muted-foreground font-medium text-sm">Total Sales (Period)</p>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{formatCurrency(totalSales)}</h2>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <motion.section
                    className="col-span-1 xl:col-span-2 space-y-8"
                    variants={containerVariants}
                >
                    <motion.div
                        className="bg-card p-6 rounded-2xl shadow-md border border-border"
                        variants={cardVariants}
                    >
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><DollarSign className="text-primary" />Revenue by Period</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="p-4 bg-muted rounded-xl flex flex-col justify-center items-center">
                                <p className="text-sm text-muted-foreground">Total Sales</p>
                                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-xl flex flex-col justify-center items-center">
                                <p className="text-sm text-muted-foreground">Total Discounts</p>
                                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalDiscounts)}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-xl flex flex-col justify-center items-center">
                                <p className="text-sm text-muted-foreground">Order Count</p>
                                <p className="text-2xl font-bold text-foreground">{orderCount}</p>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveBar
                                data={getBarChartData(financials?.revenueByMonth)}
                                keys={['revenue']}
                                indexBy="month"
                                margin={{ top: 20, right: 30, bottom: 50, left: 80 }}
                                padding={0.3}
                                colors={{ scheme: 'set1' }}
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Month',
                                    legendPosition: 'middle',
                                    legendOffset: 40,
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Revenue',
                                    legendPosition: 'middle',
                                    legendOffset: -60,
                                    format: value => `${(value / 1000).toFixed(0)}`
                                }}
                                labelSkipWidth={12}
                                labelSkipHeight={12}
                                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                                animate={true}
                                motionStiffness={90}
                                motionDamping={15}
                                theme={{
                                    textColor: 'var(--foreground)',
                                    axis: {
                                        legend: {
                                            text: {
                                                fill: 'var(--foreground)',
                                                fontSize: 14,
                                            },
                                        },
                                        ticks: {
                                            text: {
                                                fill: 'var(--muted-foreground)',
                                            },
                                        },
                                    },
                                    grid: {
                                        line: {
                                            stroke: 'var(--border)',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </motion.div>

                    <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><BsCardChecklist className="text-primary" />Top Content & Courses</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-muted rounded-xl">
                                <h4 className="text-xl font-semibold mb-2 flex items-center gap-1 text-foreground"><BookOpen className="text-secondary-foreground" />Most Enrolled Courses</h4>
                                <ul className="space-y-2">
                                    {trends?.mostEnrolledCourses?.map((course) => (
                                        <li key={course._id} className="flex justify-between items-center text-sm">
                                            <span className="truncate">{course.title}</span>
                                            <span className="font-bold text-primary">{course.totalStudents}</span>
                                        </li>
                                    )) ?? <p className="text-center text-muted-foreground">No enrolled courses.</p>}
                                </ul>
                            </div>
                            <div className="p-4 bg-muted rounded-xl">
                                <h4 className="text-xl font-semibold mb-2 flex items-center gap-1 text-foreground"><FaBlog className="text-secondary-foreground" />Most Viewed Blog Posts</h4>
                                <ul className="space-y-2">
                                    {trends?.mostViewedBlogPosts?.map((post) => (
                                        <li key={post._id} className="flex justify-between items-center text-sm">
                                            <span className="truncate">{post.title}</span>
                                            <span className="font-bold text-primary">{post.meta.views}</span>
                                        </li>
                                    )) ?? <p className="text-center text-muted-foreground">No blog posts found.</p>}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </motion.section>

                <motion.section
                    className="col-span-1 space-y-8"
                    variants={containerVariants}
                >
                    <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><Ticket className="text-primary" />Support Tickets</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-muted rounded-xl text-center">
                                <p className="text-sm text-muted-foreground">Total Tickets</p>
                                <p className="text-2xl font-bold text-foreground">{summary?.totalSupportTickets ?? 0}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-xl text-center">
                                <p className="text-sm text-muted-foreground">Avg. Resolution</p>
                                <p className="text-2xl font-bold text-foreground">{operations?.averageResolutionTime ?? 0} days</p>
                            </div>
                        </div>
                        <div className="h-[250px]">
                            <ResponsivePie
                                data={getPieChartData(operations?.ticketStats)}
                                margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                                innerRadius={0.5}
                                padAngle={0.7}
                                cornerRadius={3}
                                colors={{ scheme: 'category10' }}
                                borderWidth={1}
                                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                                radialLabelsTextColor="var(--foreground)"
                                radialLabelsLinkColor="var(--border)"
                                sliceLabelsTextColor="var(--card)"
                                theme={{
                                    textColor: 'var(--foreground)',
                                    labels: {
                                        text: {
                                            fontSize: 12,
                                        },
                                    },
                                }}
                            />
                        </div>
                    </motion.div>

                    <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><Calendar className="text-primary" />Upcoming Events</h3>
                        <ul className="space-y-4">
                            {calendar?.upcomingEvents?.length > 0 ? (
                                calendar.upcomingEvents.map((event) => (
                                    <li key={event._id} className="p-3 bg-muted rounded-lg flex items-center space-x-3">
                                        <CircleDot className="text-accent-foreground flex-shrink-0" size={20} />
                                        <div>
                                            <h4 className="font-semibold text-foreground">{event.title}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-medium">Date:</span> {new Date(event.startTime).toLocaleString()}
                                            </p>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground">No upcoming live classes scheduled.</p>
                            )}
                        </ul>
                    </motion.div>
                </motion.section>
            </div>

            <motion.section
                className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8"
                variants={containerVariants}
            >
                <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><MdOutlineLocalOffer className="text-primary" />Marketing & Ads</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-muted rounded-xl flex flex-col justify-center items-center">
                            <p className="text-sm text-muted-foreground">Ad Clicks</p>
                            <p className="text-2xl font-bold text-foreground">{adClicks}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-xl flex flex-col justify-center items-center">
                            <p className="text-sm text-muted-foreground">Ad Impressions</p>
                            <p className="text-2xl font-bold text-foreground">{adImpressions}</p>
                        </div>
                        <div className="col-span-2 p-4 bg-muted rounded-xl flex flex-col justify-center items-center">
                            <p className="text-sm text-muted-foreground">Click-Through Rate (CTR)</p>
                            <p className="text-2xl font-bold text-foreground">
                                {formatPercentage(adClicks, adImpressions)}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><Mail className="text-primary" />Recent Contacts</h3>
                    <ul className="space-y-4">
                        {operations?.recentContacts?.length > 0 ? (
                            operations.recentContacts.map((contact) => (
                                <li key={contact._id} className="p-3 bg-muted rounded-lg border-l-4 border-accent">
                                    <h4 className="font-semibold text-foreground">{contact.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1 truncate">{contact.subject}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Status: <span className="font-medium capitalize">{contact.status}</span></p>
                                </li>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground">No recent contacts found.</p>
                        )}
                    </ul>
                </motion.div>
            </motion.section>
        </motion.div>
    );
};

export default AdminDashboard;