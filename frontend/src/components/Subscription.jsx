import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSubscriptions,
  fetchMySubscriptions,
  buySubscription,
  verifyPayment,
  clearPaymentData,
  renewSubscription,
  upgradeSubscription,
} from '../store/redux/subscriptionSlice'; // Adjust path if needed
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  Sparkles,
  Star,
  Crown,
  Package,
  CalendarDays,
  Briefcase,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Re-using your custom modal component - no changes needed here.
const CustomModal = ({ isOpen, onClose, title, description, onConfirm }) => {
    if (!isOpen) return null;
    return (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-card rounded-2xl shadow-md p-8 w-full max-w-md border border-border"
          initial={{ y: -50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-foreground font-heading">{title}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
              <X size={28} />
            </button>
          </div>
          <p className="text-muted-foreground mb-8 text-lg">{description}</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 font-semibold transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors shadow-md"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
};


const SubscriptionPage = () => {
  const dispatch = useDispatch();
  const { subscriptions, mySubscriptions, loading, error, razorpayOrder } = useSelector(
    (state) => state.subscriptions
  );
  const { user } = useSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalAction, setModalAction] = useState('');
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    dispatch(fetchSubscriptions());
    if (user) {
      dispatch(fetchMySubscriptions());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (razorpayOrder && isRazorpayLoaded && selectedPlan) {
      handlePayment(razorpayOrder);
    }
  }, [razorpayOrder, isRazorpayLoaded, selectedPlan]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'An error occurred.');
    }
  }, [error]);

  const handleAction = (plan, action) => {
    if (!user) {
      toast.error('Please log in to manage subscriptions.');
      return;
    }
    setSelectedPlan(plan);
    setModalAction(action);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    if (!selectedPlan) return;
  
    switch (modalAction) {
      case 'buy':
        dispatch(buySubscription(selectedPlan._id));
        break;
      case 'renew':
        const currentSubId = mySubscriptions?.activeSubscription?._id;
        if (currentSubId) {
          dispatch(renewSubscription(currentSubId));
        } else {
          toast.error('No active subscription found to renew.');
        }
        break;
      case 'upgrade':
        dispatch(upgradeSubscription(selectedPlan._id));
        break;
      default:
        toast.error('Invalid action.');
    }
  };
  
  const handlePayment = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'LMS E-Learning',
      description: `Payment for ${selectedPlan?.name} subscription`,
      order_id: order.id,
      handler: (response) => {
        dispatch(verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          ...order.notes,
        }));
        dispatch(clearPaymentData());
        setSelectedPlan(null);
      },
      prefill: {
        name: user?.username || '',
        email: user?.email || '',
      },
      theme: {
        color: 'var(--color-primary)',
      },
      modal: {
        ondismiss: () => {
            dispatch(clearPaymentData());
            setSelectedPlan(null);
            toast.error('Payment was cancelled.');
        },
      },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const renderPlanIcon = (planType) => {
    const iconProps = { size: 28, className: "text-primary" };
    switch (planType) {
      case 'free': return <Sparkles {...iconProps} />;
      case 'basic': return <Package {...iconProps} />;
      case 'standard': return <Star {...iconProps} />;
      case 'premium': return <Crown {...iconProps} />;
      case 'pro': return <Briefcase {...iconProps} />;
      default: return <Zap {...iconProps} />;
    }
  };

  const getPlanStatus = (planId) => {
    return mySubscriptions?.activeSubscription?.subscription?._id === planId;
  };

  const getButtonDetails = (plan) => {
    if (getPlanStatus(plan._id)) {
      return { text: 'Current Plan', action: null, disabled: true };
    }

    if (!user) {
      return { text: 'Get Started', action: 'login', disabled: false };
    }

    const activeSub = mySubscriptions?.activeSubscription;
    // ✅ MAIN FIX HERE: Check for both activeSub and activeSub.subscription
    if (activeSub && activeSub.subscription) {
      const activePrice = activeSub.subscription.finalPrice;
      if (plan.finalPrice > activePrice) {
        return { text: 'Upgrade', action: 'upgrade', disabled: false };
      }
    }
    
    return { text: 'Choose Plan', action: 'buy', disabled: false };
  };

  const handleButtonClick = (plan) => {
    const { action } = getButtonDetails(plan);
    if (!action) return;
    if (action === 'login') {
        toast.info('Please log in to choose a plan.');
        return;
    }
    handleAction(plan, action);
  };
  
  const activeSub = mySubscriptions?.activeSubscription;

  const filteredAndSortedSubscriptions = subscriptions
    .filter(p => p.pricing.billingCycle === billingCycle || p.pricing.billingCycle === 'lifetime')
    .sort((a, b) => (a.finalPrice || 0) - (b.finalPrice || 0));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section className="py-24 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-4 font-display tracking-tighter">
            Flexible Plans for You
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-body">
            Choose a plan that works for you. Unlock your potential with our expert-led courses.
          </p>
        </motion.div>

        {user && activeSub && activeSub.subscription && (
            <motion.div 
                className="mb-12 bg-card border-2 border-primary rounded-2xl p-8 shadow-lg max-w-3xl mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div>
                        <span className="text-sm font-semibold text-primary uppercase tracking-wider">Your Active Plan</span>
                        <h3 className="text-3xl font-bold text-foreground font-heading mt-1">{activeSub.subscription.name}</h3>
                        {activeSub.subscription.pricing?.billingCycle !== 'lifetime' && (
                             <p className="text-muted-foreground mt-2 flex items-center gap-2">
                                <CalendarDays size={16} />
                                Renews on {new Date(activeSub.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        )}
                    </div>
                    {activeSub.subscription.pricing?.billingCycle !== 'lifetime' && (
                        <motion.button 
                            onClick={() => handleAction(activeSub.subscription, 'renew')}
                            className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-xl shadow-md transition-transform duration-300"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Renew Now
                        </motion.button>
                    )}
                </div>
            </motion.div>
        )}

        <div className="flex justify-center mb-12">
            <div className="bg-card p-1.5 rounded-xl border border-border flex items-center gap-2">
                <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                >
                    Monthly
                </button>
                 {/* A button for Quarterly was added to handle the data provided */}
                <button
                    onClick={() => setBillingCycle('quarterly')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${billingCycle === 'quarterly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                >
                    Quarterly
                </button>
                <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${billingCycle === 'yearly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                >
                    Yearly
                </button>
            </div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {filteredAndSortedSubscriptions.map((plan) => {
              const { text: buttonText, disabled } = getButtonDetails(plan);
              const isCurrent = getPlanStatus(plan._id);

              return (
                <motion.div
                  key={plan._id}
                  variants={itemVariants}
                  className={`relative flex flex-col p-8 rounded-2xl border bg-card transition-all duration-300
                    ${isCurrent ? 'border-primary border-2' : 'border-border'}
                    ${plan.isPopular && !isCurrent ? 'border-primary border-2 shadow-2xl scale-105' : 'shadow-md'}
                  `}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                       <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">
                         MOST POPULAR
                       </span>
                    </div>
                  )}

                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2">
                      {renderPlanIcon(plan.planType)}
                      <h3 className="text-2xl font-bold font-heading text-foreground">{plan.name}</h3>
                    </div>
                    <p className="text-muted-foreground mb-6 h-10">{plan.tagline}</p>

                    <div className="mb-6">
                        {plan.pricing.discountedPrice > 0 && (
                            <p className="text-lg text-muted-foreground line-through">
                                ₹{plan.pricing.basePrice}
                            </p>
                        )}
                        <div className="flex items-baseline">
                            <span className="text-5xl font-extrabold font-display text-foreground">
                                ₹{plan.finalPrice}
                            </span>
                            {plan.pricing.billingCycle !== 'lifetime' && (
                                <span className="ml-2 text-muted-foreground">/ {plan.pricing.billingCycle.replace('ly', '')}</span>
                            )}
                        </div>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <ShieldCheck className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                          <span>{feature}</span>
                        </li>
                      ))}
                      <li className="flex items-start gap-3 text-sm">
                          <ShieldCheck className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                          <span>
                            {plan.courses.isAllIncluded 
                                ? 'Access to all courses' 
                                : `Access to ${plan.courses.includedCourses.length} selected courses`
                            }
                          </span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8">
                    <motion.button
                      onClick={() => handleButtonClick(plan)}
                      disabled={disabled}
                      className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300
                        ${isCurrent
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }
                      `}
                      whileHover={{ scale: disabled ? 1 : 1.02 }}
                      whileTap={{ scale: disabled ? 1 : 0.98 }}
                    >
                      {buttonText}
                      {!isCurrent && <ArrowRight size={20} />}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalAction ? `Confirm ${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)}` : 'Confirm Action'}
        description={selectedPlan ? `Are you sure you want to ${modalAction} the ${selectedPlan.name} plan?` : ''}
        onConfirm={handleConfirm}
      />
    </section>
  );
};

export default SubscriptionPage;