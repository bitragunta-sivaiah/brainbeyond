import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders } from '../store/redux/adminSlice'; // Adjust path as per your project structure
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, Users, CalendarDays, Package, Tag, User, CreditCard } from 'lucide-react'; // Lucide Icons
import { FaBoxes } from 'react-icons/fa'; // React Icons for orders, if Lucide doesn't have a perfect fit

const AllOrderManager = () => {
  const dispatch = useDispatch();
  const { allOrders, ordersSummary, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  // Framer Motion variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] bg-background text-foreground">
        <p className="text-lg font-body">Loading orders data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] bg-background text-destructive p-4 rounded-lg shadow-md">
        <p className="text-lg font-body">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <motion.h1
        className="text-4xl font-display mb-8 text-primary-foreground text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Order Management Dashboard
      </motion.h1>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="bg-card text-card-foreground p-6 rounded-lg shadow-md flex flex-col items-center justify-center gap-3 border border-border" variants={itemVariants}>
          <ShoppingCart className="w-10 h-10 text-primary" />
          <h3 className="text-xl font-heading text-primary-foreground">Total Orders</h3>
          <p className="text-4xl font-display text-primary">{ordersSummary.totalOrders}</p>
        </motion.div>

        <motion.div className="bg-card text-card-foreground p-6 rounded-lg shadow-md flex flex-col items-center justify-center gap-3 border border-border" variants={itemVariants}>
          <Users className="w-10 h-10 text-accent-foreground" />
          <h3 className="text-xl font-heading text-accent-foreground">Students Enrolled</h3>
          <p className="text-4xl font-display text-accent-foreground">{ordersSummary.totalStudentsEnrolled}</p>
        </motion.div>

        <motion.div className="bg-card text-card-foreground p-6 rounded-lg shadow-md flex flex-col items-center justify-center gap-3 border border-border" variants={itemVariants}>
          <DollarSign className="w-10 h-10 text-green-500" />
          <h3 className="text-xl font-heading text-green-500">Total Revenue</h3>
          <p className="text-4xl font-display text-green-500">${ordersSummary.totalRevenue}</p>
        </motion.div>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border overflow-x-auto custom-scrollbar"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-2xl font-heading mb-6 text-primary-foreground">All Orders Details</h2>
        {allOrders.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No orders to display.</p>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-heading text-muted-foreground uppercase tracking-wider rounded-tl-lg">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-heading text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-heading text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-heading text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-heading text-muted-foreground uppercase tracking-wider">
                  Payment Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-heading text-muted-foreground uppercase tracking-wider">
                  Order Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-heading text-muted-foreground uppercase tracking-wider rounded-tr-lg">
                  Order Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allOrders.map((order) => (
                <motion.tr key={order._id} className="hover:bg-muted-foreground/10 transition-colors duration-200" variants={itemVariants}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-body text-foreground">
                    {order._id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-2 text-muted-foreground" />
                      <span className="text-sm font-body text-foreground">
                        {order.user ? `${order.user.profileInfo?.firstName || ''} ${order.user.profileInfo?.lastName || ''}`.trim() || order.user.email : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ul className="list-disc list-inside text-sm text-muted-foreground font-body">
                      {order.items.map((item, index) => (
                        <li key={index}>
                          <Package className="inline-block w-4 h-4 mr-1 align-text-bottom text-secondary-foreground" />
                          {item.name} ({item.quantity}) - ${parseFloat(item.price.toString()).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                    ${parseFloat(order.pricing.total.toString()).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                      ${order.payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                         order.payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                         order.payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                         'bg-gray-100 text-gray-800'}`}>
                      {order.payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                      ${order.orderStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                         order.orderStatus === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                         order.orderStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
                         'bg-red-100 text-red-800'}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <CalendarDays className="inline-block w-4 h-4 mr-1 align-text-bottom" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
};

export default AllOrderManager;
