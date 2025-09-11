import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  clearCouponError,
} from '../../store/redux/couponSlice';
import { fetchAllCourses } from '../../store/redux/courseSlice';
import { fetchSubscriptions } from '../../store/redux/subscriptionSlice';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  Edit,
  Trash2,
  X,
  Calendar,
  DollarSign,
  Users,
  Grid,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CouponManager = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error } = useSelector((state) => state.coupons);
  // Corrected state access for courses
  const { courses } = useSelector((state) => state.course); 
  const { subscriptions } = useSelector((state) => state.subscriptions);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [formState, setFormState] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    maxUses: null,
    isSingleUsePerUser: false,
    applicableTo: 'all',
    specificItems: [],
  });

  useEffect(() => {
    dispatch(fetchCoupons());
    dispatch(fetchAllCourses());
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  // Handle errors from the Redux state with toasts
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCouponError());
    }
  }, [dispatch, error]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'specificItems') {
      const selectedOptions = Array.from(e.target.options)
        .filter((option) => option.selected)
        .map((option) => option.value);
      setFormState((prev) => ({ ...prev, [name]: selectedOptions }));
    } else {
      setFormState((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleCreateOrUpdateCoupon = (e) => {
    e.preventDefault();

    // 1. Corrected: Add validation for end date
    if (new Date(formState.endDate) <= new Date(formState.startDate)) {
      toast.error("End date must be after the start date.");
      return;
    }

    const couponData = {
      ...formState,
      discountValue: parseFloat(formState.discountValue),
      minOrderValue: parseFloat(formState.minOrderValue),
      maxDiscount: formState.discountType === 'percentage' ? parseFloat(formState.maxDiscount) : undefined,
      maxUses: formState.maxUses ? parseInt(formState.maxUses, 10) : null,
      startDate: formState.startDate,
      endDate: formState.endDate,
      specificItems: formState.applicableTo !== 'all' ? formState.specificItems : [],
    };

    if (isEditing) {
      dispatch(updateCoupon({ couponId: selectedCoupon._id, updateData: couponData }));
    } else {
      dispatch(createCoupon(couponData));
    }
    closeModal();
  };

  const handleDeleteCoupon = (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      dispatch(deleteCoupon(couponId));
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedCoupon(null);
    setFormState({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      startDate: '',
      endDate: '',
      maxUses: null,
      isSingleUsePerUser: false,
      applicableTo: 'all',
      specificItems: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setIsEditing(true);
    setSelectedCoupon(coupon);
    setFormState({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount || 0,
      startDate: coupon.startDate ? format(parseISO(coupon.startDate), 'yyyy-MM-dd') : '',
      endDate: coupon.endDate ? format(parseISO(coupon.endDate), 'yyyy-MM-dd') : '',
      maxUses: coupon.maxUses,
      isSingleUsePerUser: coupon.isSingleUsePerUser,
      applicableTo: coupon.applicableTo,
      specificItems: coupon.specificItems || [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCoupon(null);
  };

  const CouponCard = ({ coupon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-card shadow-md relative rounded-lg overflow-hidden p-6 border border-border flex flex-col justify-between h-full"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            {coupon.code}
          </span>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                coupon.isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {coupon.isActive ? 'Active' : 'Inactive'}
            </span>
            <span
              className={`px-3 py-1 rounded-b-xl absolute right-1 top-0 text-xs font-semibold ${
                coupon.isSingleUsePerUser
                  ? 'bg-[#3af800] '
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {coupon.isSingleUsePerUser ? 'Single Use' : 'Multi-Use'}
            </span>
          </div>
        </div>

        <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
          {coupon.title || 'Untitled Coupon'}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm line-clamp-2">
          {coupon.description || 'No description provided.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-4 text-sm">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 text-primary mr-2" />
            <span className="font-medium text-foreground">
              {coupon.discountType === 'percentage'
                ? `${coupon.discountValue}% Off`
                : `$${coupon.discountValue} Off`}
            </span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 text-primary mr-2" />
            <span className="font-medium text-foreground">
              Used {coupon.uses} times
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-primary mr-2" />
            <span className="font-medium text-foreground">
              Valid until: {format(parseISO(coupon.endDate), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center">
            <Grid className="w-4 h-4 text-primary mr-2" />
            <span className="font-medium text-foreground capitalize">
              Applies to: {coupon.applicableTo}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openEditModal(coupon)}
          className="p-2 rounded-md hover:bg-secondary text-secondary-foreground transition-colors"
          aria-label="Edit Coupon"
        >
          <Edit className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleDeleteCoupon(coupon._id)}
          className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
          aria-label="Delete Coupon"
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Coupon Management
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-colors"
            aria-label="Create New Coupon"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Coupon
          </motion.button>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center p-10">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <CouponCard key={coupon._id} coupon={coupon} />
                ))
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center text-muted-foreground p-10"
                >
                  No coupons found. Click the button above to create one!
                </motion.p>
              )}
            </div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-lg mx-auto overflow-y-scroll max-h-[90vh]"
            >
              <div className="p-6">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <h2 className="font-heading text-2xl font-bold">
                    {isEditing ? 'Edit Coupon' : 'Create New Coupon'}
                  </h2>
                  <button onClick={closeModal} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Close modal">
                    <X className="w-6 h-6 text-foreground" />
                  </button>
                </div>
                <div className="pt-6">
                  <form onSubmit={handleCreateOrUpdateCoupon} className="space-y-6">
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-foreground">
                        Coupon Code
                      </label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        value={formState.code}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        required
                        disabled={isEditing}
                      />
                    </div>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-foreground">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formState.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="discountType" className="block text-sm font-medium text-foreground">
                        Discount Type
                      </label>
                      <select
                        id="discountType"
                        name="discountType"
                        value={formState.discountType}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        required
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="discountValue" className="block text-sm font-medium text-foreground">
                        Discount Value
                      </label>
                      <input
                        type="number"
                        id="discountValue"
                        name="discountValue"
                        value={formState.discountValue}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        min="0"
                        required
                      />
                    </div>

                    {formState.discountType === 'percentage' && (
                      <div>
                        <label htmlFor="maxDiscount" className="block text-sm font-medium text-foreground">
                          Maximum Discount Amount
                        </label>
                        <input
                          type="number"
                          id="maxDiscount"
                          name="maxDiscount"
                          value={formState.maxDiscount}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          min="0"
                          required={formState.discountType === 'percentage'}
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="minOrderValue" className="block text-sm font-medium text-foreground">
                        Minimum Order Value
                      </label>
                      <input
                        type="number"
                        id="minOrderValue"
                        name="minOrderValue"
                        value={formState.minOrderValue}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        min="0"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
                          Start Date
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={formState.startDate}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-foreground">
                          End Date
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={formState.endDate}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="maxUses" className="block text-sm font-medium text-foreground">
                        Max Uses (leave empty for unlimited)
                      </label>
                      <input
                        type="number"
                        id="maxUses"
                        name="maxUses"
                        value={formState.maxUses || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        min="1"
                      />
                    </div>

                    <div>
                      <label htmlFor="applicableTo" className="block text-sm font-medium text-foreground">
                        Applicable To
                      </label>
                      <select
                        id="applicableTo"
                        name="applicableTo"
                        value={formState.applicableTo}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        required
                      >
                        <option value="all">All Items</option>
                        <option value="courses">Specific Courses</option>
                        <option value="subscriptions">Specific Subscriptions</option>
                      </select>
                    </div>

                    {formState.applicableTo !== 'all' && (
                      <div>
                        <label htmlFor="specificItems" className="block text-sm font-medium text-foreground">
                          Select Specific {formState.applicableTo}
                        </label>
                        <select
                          id="specificItems"
                          name="specificItems"
                          multiple
                          value={formState.specificItems}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-border border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-32"
                          required={formState.applicableTo !== 'all'}
                        >
                          {formState.applicableTo === 'courses' &&
                            courses.map((course) => (
                              <option key={course._id} value={course._id}>
                                {course.title}
                              </option>
                            ))}
                          {formState.applicableTo === 'subscriptions' &&
                            subscriptions.map((sub) => (
                              // Corrected: Use sub.planName instead of sub.name
                              <option key={sub._id} value={sub._id}>
                                {sub.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isSingleUsePerUser"
                        name="isSingleUsePerUser"
                        checked={formState.isSingleUsePerUser}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-border border text-primary focus:ring-primary"
                      />
                      <label htmlFor="isSingleUsePerUser" className="ml-2 block text-sm text-foreground">
                        Single use per user
                      </label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-md hover:bg-primary/90 transition-colors"
                      >
                        {isEditing ? 'Save Changes' : 'Create Coupon'}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponManager;