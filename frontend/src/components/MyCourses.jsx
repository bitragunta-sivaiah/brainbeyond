import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchMyCourses } from '../store/redux/studentCourseSlice';
import { fetchMySubscriptions } from '../store/redux/subscriptionSlice';
import { BiTime } from 'react-icons/bi';
import { FaStar } from 'react-icons/fa';
import { ArrowRightCircle, BadgeCheck, Calendar, DollarSign, Award, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Custom circular progress component
const CircleProgress = ({ progress, size, strokeWidth, strokeColor, trailColor }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
                className="transition-all duration-500 ease-in-out"
                stroke={trailColor}
                fill="transparent"
                strokeWidth={strokeWidth}
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <motion.circle
                className="transition-all duration-500 ease-in-out"
                stroke={strokeColor}
                fill="transparent"
                strokeWidth={strokeWidth}
                r={radius}
                cx={size / 2}
                cy={size / 2}
                strokeLinecap="round"
                initial={{ strokeDasharray: 0, strokeDashoffset: circumference }}
                animate={{ strokeDasharray: circumference, strokeDashoffset: offset }}
            />
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold"
                style={{ fill: strokeColor }}
            >
                {`${Math.round(progress)}%`}
            </text>
        </svg>
    );
};

const MyCourses = () => {
    const dispatch = useDispatch();
    const { myCourses, status, error } = useSelector((state) => state.studentCourses);
    const { mySubscriptions, loading: subLoading, error: subError } = useSelector((state) => state.subscriptions);

    useEffect(() => {
        dispatch(fetchMyCourses());
        dispatch(fetchMySubscriptions());
    }, [dispatch]);

    const renderSubscriptionInfo = () => {
        const activeSub = mySubscriptions?.activeSubscription;
        const allSubs = mySubscriptions?.allSubscriptions || [];

        if (subLoading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            );
        }

        if (subError) {
            return <p className="text-destructive">Failed to load subscriptions: {subError.message || 'Server error'}</p>;
        }

        return (
            <div className="space-y-8">
                {activeSub ? (
                    <div className="bg-card p-6 rounded-lg shadow-md border-l-4 border-primary transition-shadow hover:shadow-lg">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-foreground">{activeSub.subscription.name}</h3>
                            <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-primary/20 text-primary mt-2 sm:mt-0">
                                <BadgeCheck size={16} className="mr-1" /> Active
                            </span>
                        </div>
                        <p className="text-muted-foreground mb-4">{activeSub.subscription.tagline}</p>
                        <div className="space-y-2 text-sm text-custom">
                            <div className="flex items-center">
                                <Calendar size={16} className="mr-2 text-primary" />
                                Valid until: {format(new Date(activeSub.endDate), 'PP')}
                            </div>
                            <div className="flex items-center">
                                <DollarSign size={16} className="mr-2 text-primary" />
                                <span className="font-semibold text-foreground">Price: </span>
                                {activeSub.subscription.pricing.discountedPrice > 0 ? (
                                    <>
                                        <span className="line-through text-muted-foreground mr-1">
                                            {activeSub.subscription.pricing.basePrice}
                                        </span>
                                        <span>
                                            {activeSub.subscription.pricing.discountedPrice} {activeSub.subscription.pricing.currency} / {activeSub.subscription.pricing.billingCycle}
                                        </span>
                                    </>
                                ) : (
                                    <span>
                                        {activeSub.subscription.pricing.basePrice} {activeSub.subscription.pricing.currency} / {activeSub.subscription.pricing.billingCycle}
                                    </span>
                                )}
                            </div>
                            {activeSub.subscription.courses.isAllIncluded ? (
                                <div className="flex items-center">
                                    <Award size={16} className="mr-2 text-primary" />
                                    Access to all courses
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <Award size={16} className="mr-2 text-primary" />
                                    Access to {activeSub.subscription.courses.includedCourses.length} courses
                                </div>
                            )}
                            <h4 className="font-semibold text-foreground mt-4">Features:</h4>
                            <ul className="list-disc list-inside space-y-1 pl-4">
                                {activeSub.subscription.features.map((feature, index) => (
                                    <li key={index} className="text-sm text-muted-foreground">{feature}</li>
                                ))}
                            </ul>
                        </div>
                        <Link to="/subscriptions" className="mt-4 inline-flex items-center text-primary font-semibold hover:underline">
                            Manage Subscription <ArrowRightCircle size={16} className="ml-1" />
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-yellow-500 transition-shadow hover:shadow-lg">
                        <h3 className="text-xl font-bold mb-2 text-custom">No Active Subscription</h3>
                        <p className="text-muted-foreground">Subscribe to get unlimited access to all premium courses!</p>
                        <Link to="/subscriptions" className="mt-4 inline-flex items-center text-primary font-semibold hover:underline">
                            Explore Plans <ArrowRightCircle size={16} className="ml-1" />
                        </Link>
                    </div>
                )}
                
                {allSubs.length > 1 && (
                    <div className="bg-card p-6 rounded-lg shadow-sm border border-border mt-8">
                        <h4 className="text-lg font-bold text-foreground mb-4">Past Subscriptions</h4>
                        <ul className="space-y-4">
                            {allSubs.filter(s => !s.isActive).map((sub, index) => (
                                <li key={sub._id}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-foreground">{sub.subscription.name}</p>
                                            <p className="text-sm text-muted-foreground">Expired: {format(new Date(sub.endDate), 'PP')}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (status === 'loading') {
            return (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
            );
        }

        if (status === 'failed') {
            return (
                <div className="text-center py-10">
                    <p className="text-destructive font-semibold">Error: {error}</p>
                </div>
            );
        }

        const coursesToShow = myCourses || [];

        if (coursesToShow.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-custom">You're not enrolled in any courses yet. <Link to="/courses" className="text-primary hover:underline">Browse courses</Link> to get started!</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {coursesToShow.map((course) => (
                    <motion.div
                        key={course._id}
                        className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden transition-all duration-300 hover:shadow-xl"
                        whileHover={{ scale: 1.02 }}
                    >
                        <Link to={`/courses/${course.slug}/learn`}>
                            <div className="relative">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-40 object-cover"
                                />
                                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md">
                                    <CircleProgress
                                        progress={course.progress}
                                        size={40}
                                        strokeWidth={4}
                                        strokeColor="#2f27ce"
                                        trailColor="#e9ecef"
                                    />
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-foreground mb-2 font-heading truncate">
                                    {course.title}
                                </h3>
                                {course.instructors && course.instructors.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <img
                                            src={course.instructors[0].profileInfo.avatar}
                                            alt={course.instructors[0].fullName}
                                            className="w-6 h-6 rounded-full object-cover border-2 border-primary"
                                        />
                                        <span>By {course.instructors[0].fullName}</span>
                                    </div>
                                )}
                                <p className="text-sm text-custom mb-4 line-clamp-2">
                                    {course.shortDescription}
                                </p>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <BiTime className="text-primary text-base" />
                                        <span>{course.duration} hrs</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FaStar className="text-yellow-400" />
                                        <span className="font-semibold text-foreground">{course?.rating?.toFixed(1)}</span>
                                        <span className="text-xs">{course.totalRatings}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto py-8 px-4 font-body">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground font-display tracking-tight">
                My Dashboard
            </h1>
            <p className="text-lg text-custom mb-8">
                Your learning journey at a glance.
            </p>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Your Subscription</h2>
            {renderSubscriptionInfo()}
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Your Courses</h2>
            {renderContent()}
        </div>
    );
};

export default MyCourses;