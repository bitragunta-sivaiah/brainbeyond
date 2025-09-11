import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSubscriptions,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from '../../store/redux/subscriptionSlice';
import { fetchAllCourses } from '../../store/redux/courseSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  XCircle,
  Loader2,
  Star,
} from 'lucide-react';

/**
 * Helper function to generate a slug from a string.
 * @param {string} name - The name to convert into a slug.
 * @returns {string} The generated slug.
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

/**
 * PlanModal Component
 * A modal for creating and editing subscription plans.
 */
const PlanModal = ({ plan, isOpen, onClose, onSubmit, allCourses }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    tagline: '',
    pricing: {
      basePrice: 0,
      currency: 'INR',
      billingCycle: 'monthly',
      discountedPrice: 0,
    },
    planType: 'basic',
    features: [''],
    courses: {
      isAllIncluded: false,
      includedCourses: [],
    },
    status: 'active',
    isPopular: false,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        ...plan,
        pricing: { ...plan.pricing },
        features: plan.features && plan.features.length > 0 ? plan.features : [''],
        courses: {
          isAllIncluded: plan.courses?.isAllIncluded || false,
          includedCourses: plan.courses?.includedCourses?.map((c) => c._id || c.id) || [],
        },
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        tagline: '',
        pricing: {
          basePrice: 0,
          currency: 'INR',
          billingCycle: 'monthly',
          discountedPrice: 0,
        },
        planType: 'basic',
        features: [''],
        courses: {
          isAllIncluded: false,
          includedCourses: [],
        },
        status: 'active',
        isPopular: false,
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newFormData = { ...formData };

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      newFormData = {
        ...newFormData,
        [parent]: {
          ...newFormData[parent],
          [child]: type === 'number' ? Number(value) : type === 'checkbox' ? checked : value,
        },
      };
    } else {
      newFormData = {
        ...newFormData,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'name') {
        newFormData.slug = generateSlug(value);
      }
    }
    setFormData(newFormData);
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      features: newFeatures.length > 0 ? newFeatures : [''],
    });
  };

  const handleCourseSelection = (e) => {
    const { options } = e.target;
    const selectedCourses = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedCourses.push(options[i].value);
      }
    }
    setFormData((prev) => ({
      ...prev,
      courses: {
        ...prev.courses,
        includedCourses: selectedCourses,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const featuresToSubmit = formData.features.filter((f) => f.trim() !== '');
    onSubmit({ ...formData, features: featuresToSubmit });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="w-full max-w-3xl overflow-y-auto custom-scrollbar max-h-[90vh] rounded-xl bg-card text-card-foreground p-6 shadow-2xl"
      >
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-3xl font-heading font-bold text-primary">
              {plan ? 'Edit Plan' : 'Create New Plan'}
            </h2>
            <p className="text-sm font-body text-muted-foreground">
              Define the details and features of your subscription plan.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-muted-foreground">Plan Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tagline" className="text-sm font-medium text-muted-foreground">Tagline</label>
                <input
                  id="tagline"
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                required
                className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label htmlFor="basePrice" className="text-sm font-medium text-muted-foreground">Base Price</label>
                <input
                  id="basePrice"
                  type="number"
                  name="pricing.basePrice"
                  value={formData.pricing.basePrice}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="discountedPrice" className="text-sm font-medium text-muted-foreground">Discounted Price</label>
                <input
                  id="discountedPrice"
                  type="number"
                  name="pricing.discountedPrice"
                  value={formData.pricing.discountedPrice}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium text-muted-foreground">Currency</label>
                <select
                  id="currency"
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="billingCycle" className="text-sm font-medium text-muted-foreground">Billing Cycle</label>
                <select
                  id="billingCycle"
                  name="pricing.billingCycle"
                  value={formData.pricing.billingCycle}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label htmlFor="planType" className="text-sm font-medium text-muted-foreground">Plan Type</label>
                  <select
                    id="planType"
                    name="planType"
                    value={formData.planType}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium text-muted-foreground">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="isPopular"
                type="checkbox"
                name="isPopular"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="h-4 w-4 rounded border border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isPopular" className="text-sm font-medium text-muted-foreground">Mark as Popular</label>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-muted-foreground">Features</label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {(formData.features.length > 1 || feature.trim() !== '') && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="w-full p-2 rounded-md border border-dashed border-border text-primary hover:bg-muted transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Another Feature</span>
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-muted-foreground">Course Access</label>
              <div className="flex items-center space-x-2">
                <input
                  id="isAllIncluded"
                  type="checkbox"
                  name="courses.isAllIncluded"
                  checked={formData.courses.isAllIncluded}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      courses: { ...prev.courses, isAllIncluded: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isAllIncluded" className="text-sm font-medium text-muted-foreground">Include All Courses</label>
              </div>
              {!formData.courses.isAllIncluded && (
                <div className="space-y-2">
                  <label htmlFor="includedCourses" className="text-sm font-medium text-muted-foreground">Select Included Courses</label>
                  <select
                    id="includedCourses"
                    multiple
                    name="courses.includedCourses"
                    value={formData.courses.includedCourses}
                    onChange={handleCourseSelection}
                    className="w-full h-48 p-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary custom-scrollbar"
                  >
                    {allCourses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-secondary-foreground bg-secondary hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-accent-foreground transition-colors"
              >
                Save Plan
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---

const SubscriptionManager = () => {
  const dispatch = useDispatch();
  const { subscriptions, loading, error } = useSelector((state) => state.subscriptions);
  const { courses: allCourses } = useSelector((state) => state.course);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    dispatch(fetchSubscriptions());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  const handleCreate = (planData) => {
    dispatch(createSubscriptionPlan(planData));
  };

  const handleUpdate = (planData) => {
    dispatch(updateSubscriptionPlan({ id: selectedPlan._id, planData }));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      dispatch(deleteSubscriptionPlan(id));
    }
  };

  const handleOpenModal = (plan = null) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <XCircle className="h-20 w-20 text-destructive" />
        <h1 className="mt-4 text-3xl font-heading font-bold text-destructive">Error Loading Subscriptions</h1>
        <p className="mt-2 text-lg font-body text-muted-foreground">{error.message || 'Something went wrong.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold font-display text-primary tracking-tight leading-tight">
          Subscription Management
        </h1>
        <p className="mt-4 text-lg font-body text-muted-foreground max-w-2xl mx-auto">
          Effortlessly create, update, and manage all your subscription plans from a single, intuitive interface.
        </p>
        <button
          onClick={() => handleOpenModal()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-lg font-semibold font-body text-primary-foreground shadow-md transition-all duration-300 hover:bg-accent-foreground transform hover:scale-105"
        >
          <Plus className="mr-3" size={24} />
          Create New Plan
        </button>
      </div>

      <hr className="my-12 border-border" />

      {/* Plans Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {subscriptions.map((plan) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className="relative bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-border"
              >
                {plan.isPopular && (
                  <div className="absolute top-4 right-4 text-sm font-semibold text-accent-foreground bg-accent px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={14} className="text-accent-foreground" fill="currentColor" /> POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-heading font-bold text-primary">{plan.name}</h3>
                <p className="mt-1 text-sm font-body text-muted-foreground">{plan.tagline}</p>
                <div className="flex items-baseline mt-4 mb-2">
                  {plan.pricing.discountedPrice > 0 ? (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-extrabold font-display text-foreground">{`₹${plan.pricing.discountedPrice}`}</span>
                      <span className="text-lg font-body text-muted-foreground line-through">{`₹${plan.pricing.basePrice}`}</span>
                    </div>
                  ) : (
                    <span className="text-4xl font-extrabold font-display text-foreground">{`₹${plan.pricing.basePrice}`}</span>
                  )}
                  <span className="text-base font-body text-muted-foreground ml-2">/{plan.pricing.billingCycle}</span>
                </div>
                <p className="text-sm font-body text-muted-foreground mb-4">{plan.description}</p>
                
                <ul className="space-y-2 flex-1 text-sm font-body text-foreground">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check size={16} className="text-primary mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="flex gap-2 pt-4 border-t border-border mt-4">
                  <button
                    onClick={() => handleOpenModal(plan)}
                    className="flex-1 inline-flex items-center justify-center p-2 rounded-md border border-border text-secondary-foreground bg-secondary hover:bg-muted transition-colors"
                  >
                    <Edit size={16} className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="flex-1 inline-flex items-center justify-center p-2 rounded-md bg-destructive text-white hover:text-black border-border border   hover:bg-destructive-foreground transition-colors"
                  >
                    <Trash2 size={16} className="mr-2" /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <PlanModal
            plan={selectedPlan}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={selectedPlan ? handleUpdate : handleCreate}
            allCourses={allCourses}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionManager;