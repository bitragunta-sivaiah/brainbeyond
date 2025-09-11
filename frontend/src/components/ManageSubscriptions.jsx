import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchMySubscriptions } from '../store/redux/subscriptionSlice';
import { Calendar, DollarSign, Award, ArrowRightCircle, BadgeCheck, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const ManageSubscriptions = () => {
    const dispatch = useDispatch();
    const { mySubscriptions, loading, error } = useSelector((state) => state.subscriptions);

    useEffect(() => {
        dispatch(fetchMySubscriptions());
    }, [dispatch]);

    const renderActiveSubscription = () => {
        const activeSub = mySubscriptions?.activeSubscription;

        if (loading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center p-8 bg-destructive/10 text-destructive rounded-lg border border-destructive">
                    <XCircle size={48} className="mx-auto mb-4" />
                    <p className="font-semibold">Failed to load subscription details.</p>
                    <p className="text-sm">{error.message || 'Please try again later.'}</p>
                </div>
            );
        }

        if (!activeSub) {
            return (
                <div className="bg-card p-8 rounded-lg shadow-md border-l-4 border-yellow-500 text-center">
                    <h3 className="text-2xl font-bold mb-2 text-foreground">No Active Subscription</h3>
                    <p className="text-muted-foreground mb-4">You currently don't have an active subscription plan. Subscribe to get unlimited access to all premium courses!</p>
                    <Link to="/subscriptions" className="inline-flex items-center px-6 py-3 rounded-full text-center font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
                        Explore Plans <ArrowRightCircle size={16} className="ml-2" />
                    </Link>
                </div>
            );
        }

        const subDetails = activeSub.subscription;
        const endDate = format(new Date(activeSub.endDate), 'PPP'); // Using a more readable date format
        const isAutoRenew = activeSub.autoRenew;

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-card p-8 rounded-lg shadow-md border border-primary transition-shadow hover:shadow-lg"
            >
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-foreground">{subDetails.name}</h3>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className="inline-flex items-center px-4 py-1.5 text-sm font-semibold rounded-full bg-primary/20 text-primary">
                            <BadgeCheck size={18} className="mr-2" /> Active
                        </span>
                        {isAutoRenew && (
                            <span className="inline-flex items-center px-4 py-1.5 text-sm font-semibold rounded-full bg-blue-500/20 text-blue-500">
                                Auto-Renew On
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-lg text-muted-foreground mb-4">{subDetails.tagline}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-custom">
                    <div className="flex items-center">
                        <Calendar size={18} className="mr-2 text-primary flex-shrink-0" />
                        <div>
                            <span className="font-medium text-foreground">Start Date:</span> {format(new Date(activeSub.startDate), 'PPP')}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Calendar size={18} className="mr-2 text-primary flex-shrink-0" />
                        <div>
                            <span className="font-medium text-foreground">Renews On:</span> {endDate}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <DollarSign size={18} className="mr-2 text-primary flex-shrink-0" />
                        <div>
                            <span className="font-medium text-foreground">Price:</span>
                            {subDetails.pricing.discountedPrice > 0 ? (
                                <>
                                    <span className="line-through text-muted-foreground mr-1">{subDetails.pricing.basePrice}</span>
                                    <span>{subDetails.pricing.discountedPrice} {subDetails.pricing.currency} / {subDetails.pricing.billingCycle}</span>
                                </>
                            ) : (
                                <span>{subDetails.pricing.basePrice} {subDetails.pricing.currency} / {subDetails.pricing.billingCycle}</span>
                            )}
                        </div>
                    </div>
                    {subDetails.courses.isAllIncluded ? (
                        <div className="flex items-center">
                            <Award size={18} className="mr-2 text-primary flex-shrink-0" />
                            <span className="font-medium text-foreground">Course Access:</span> All Courses
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <Award size={18} className="mr-2 text-primary flex-shrink-0" />
                            <span className="font-medium text-foreground">Courses Included:</span> {subDetails.courses.includedCourses.length}
                        </div>
                    )}
                </div>
                <div className="mt-8">
                    <h4 className="font-semibold text-lg text-foreground mb-2">Features Included:</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 list-none space-y-2 pl-0">
                        {subDetails.features.map((feature, index) => (
                            <li key={index} className="flex items-start text-sm text-muted-foreground">
                                <BadgeCheck size={18} className="text-green-500 mr-2 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Link to={`/pricing`} className="w-full sm:w-auto px-6 py-3 rounded-full text-center font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        Renew Now
                    </Link>
                    <Link to="/pricing" className="w-full sm:w-auto px-6 py-3 rounded-full text-center font-semibold border border-border text-foreground hover:bg-muted transition-colors">
                        Explore Other Plans
                    </Link>
                </div>
            </motion.div>
        );
    };

    const renderPastSubscriptions = () => {
        const pastSubs = (mySubscriptions?.allSubscriptions || []).filter(sub => !sub.isActive);
        if (pastSubs.length === 0) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-12"
            >
                <h3 className="text-2xl font-bold text-foreground mb-4">Past Subscriptions</h3>
                <div className="space-y-4">
                    {pastSubs.map(sub => (
                        <div key={sub._id} className="bg-card p-6 rounded-lg shadow-sm border border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-foreground">{sub.subscription.name}</p>
                                    <p className="text-sm text-muted-foreground">Expired on {format(new Date(sub.endDate), 'PPP')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="container mx-auto py-8 px-4 font-body">
            <motion.h1 
                className="text-3xl sm:text-4xl font-extrabold mb-8 text-foreground"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                My Subscriptions 👑
            </motion.h1>
            {renderActiveSubscription()}
            {renderPastSubscriptions()}
        </div>
    );
};

export default ManageSubscriptions;