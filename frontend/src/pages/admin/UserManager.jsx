import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx"; // Import xlsx library
import {
  fetchAllUsers,
  softDeleteUser,
  restoreUser,
  fetchSingleUser,
  updateUserRole,
} from "../../store/redux/authSlice"; // Adjust the path as needed
import {
  Trash2,
  Undo2,
  CircleCheck,
  CircleX,
  Loader2,
  Info,
  Search,
  Users,
  User,
  Crown,
  Eye,
  ArrowRight,
  Download, // Import Download icon
  Square,
  CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const UserManager = () => {
  const dispatch = useDispatch();
  const { users, isLoading, error, selectedUser } = useSelector((state) => state.auth);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [actionUser, setActionUser] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [newRole, setNewRole] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // New state for export functionality
  const [exportSelectionType, setExportSelectionType] = useState("all"); // "all", "student", "admin", "instructor", "customercare", "manual"
  const [selectedUserIdsForExport, setSelectedUserIdsForExport] = useState(new Set());

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  // Function to handle soft delete or restore action confirmation
  const handleActionClick = (user, type) => {
    setActionUser(user);
    setActionType(type);
    setShowConfirmationModal(true);
  };

  // Function to confirm and dispatch the delete/restore action
  const handleConfirmAction = async () => {
    if (!actionUser) return;
    try {
      if (actionType === "delete") {
        await dispatch(softDeleteUser(actionUser._id)).unwrap();
      } else if (actionType === "restore") {
        await dispatch(restoreUser(actionUser._id)).unwrap();
      }
      toast.success(
        `User ${actionUser.username} successfully ${
          actionType === "delete" ? "deleted" : "restored"
        }.`
      );
    } catch (err) {
      toast.error(`Failed to ${actionType} user. Please try again.`);
    } finally {
      setShowConfirmationModal(false);
      setActionUser(null);
      setActionType(null);
    }
  };

  // Function to cancel any modal action
  const handleCancelAction = () => {
    setShowConfirmationModal(false);
    setActionUser(null);
    setActionType(null);
    setShowRoleModal(false);
    setNewRole(""); // Reset new role when closing modal
  };

  // Function to view a single user's details and open the role update modal
  const handleViewUser = (userId) => {
    dispatch(fetchSingleUser(userId));
    setShowRoleModal(true);
  };

  // Function to update a user's role
  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await dispatch(updateUserRole({ userId: selectedUser._id, newRole })).unwrap();
      toast.success(`Role for ${selectedUser.username} updated to ${newRole}.`);
      setShowRoleModal(false);
      setNewRole("");
    } catch (err) {
      toast.error(`Failed to update user role. Please try again.`);
    }
  };

  // Helper function to get role-specific icons
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown size={16} />;
      case "student":
        return <User size={16} />;
      case "instructor":
        return <Users size={16} />;
      case "customercare":
        return <Users size={16} />;
      default:
        return <User size={16} />;
    }
  };

  // Filtered users based on search term and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profileInfo?.firstName && user.profileInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.profileInfo?.lastName && user.profileInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole =
      filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // --- New Export Selection Logic ---
  const handleToggleSelectUserForExport = (userId) => {
    setSelectedUserIdsForExport(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAllForExport = (isChecked) => {
    if (isChecked) {
      const allFilteredUserIds = new Set(filteredUsers.map(user => user._id));
      setSelectedUserIdsForExport(allFilteredUserIds);
    } else {
      setSelectedUserIdsForExport(new Set());
    }
  };

  const isAllFilteredUsersSelected = filteredUsers.length > 0 &&
    filteredUsers.every(user => selectedUserIdsForExport.has(user._id));

  // --- Excel Export Functionality ---
  const handleExportUsers = () => {
    let usersToExport = [];

    if (exportSelectionType === "all") {
      usersToExport = filteredUsers;
    } else if (exportSelectionType === "manual") {
      usersToExport = filteredUsers.filter(user => selectedUserIdsForExport.has(user._id));
    } else { // Specific role selection (admin, student, instructor, customercare)
      usersToExport = filteredUsers.filter(user => user.role === exportSelectionType);
    }

    if (usersToExport.length === 0) {
      toast.info("No users to export based on your current selection.");
      return;
    }

    // Prepare data for export
    const dataToExport = usersToExport.map((user) => ({
      ID: user._id,
      Username: user.username,
      Email: user.email,
      Role: user.role,
      "First Name": user.profileInfo?.firstName || "",
      "Last Name": user.profileInfo?.lastName || "",
      "Full Name": user.profileInfo?.firstName && user.profileInfo?.lastName
        ? `${user.profileInfo.firstName} ${user.profileInfo.lastName}`
        : user.username,
      Phone: user.profileInfo?.phone || "",
      Gender: user.profileInfo?.gender || "",
      "Street Address": user.profileInfo?.address?.street || "",
      City: user.profileInfo?.address?.city || "",
      State: user.profileInfo?.address?.state || "",
      Country: user.profileInfo?.address?.country || "",
      "Zip Code": user.profileInfo?.address?.zipCode || "",
      "Is Verified": user.isVerified ? "Yes" : "No",
      "Is Deleted": user.isDeleted ? "Yes" : "No",
      "Created At": new Date(user.createdAt).toLocaleDateString("en-GB") || "",
      "Last Login": user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-GB") : "N/A",
    }));

    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    // Generate and download the Excel file
    XLSX.writeFile(wb, "user_details.xlsx");
    toast.success("User details exported to Excel!");
  };
  // --- End Excel Export Functionality ---


  const loadingUsers = isLoading && !selectedUser;
  const loadingSingleUser = isLoading && selectedUser;

  // Render loading state for initial user fetch
  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-xl font-body">Loading users...</p>
      </div>
    );
  }

  // Render error state for initial user fetch
  if (error && !selectedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground text-center p-8">
        <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-6 flex flex-col items-center gap-4">
          <CircleX className="w-10 h-10 text-destructive" />
          <h2 className="text-2xl font-heading text-destructive-foreground">
            Error Loading Users
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-6 md:p-10">
      <header className="w-full max-w-6xl flex flex-wrap gap-4  justify-between items-center mb-8 pb-4 border-b border-border">
        <h1 className="text-3xl font-heading text-foreground mb-4 sm:mb-0">
          User Management
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {/* Role Filter Dropdown */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="student">Student</option>
            <option value="customercare">Customer Care</option>
          </select>

          {/* New: Export Selection Dropdown */}
          <select
            value={exportSelectionType}
            onChange={(e) => {
              setExportSelectionType(e.target.value);
              setSelectedUserIdsForExport(new Set()); // Reset manual selection when type changes
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Export: All Users</option>
            <option value="student">Export: Student Role</option>
            <option value="admin">Export: Admin Role</option>
            <option value="instructor">Export: Instructor Role</option>
            <option value="customercare">Export: Customer Care Role</option>
            <option value="manual">Export: Manually Select</option>
          </select>

          {/* New: Select All checkbox for manual selection */}
          {exportSelectionType === "manual" && filteredUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="selectAllExport"
                checked={isAllFilteredUsersSelected}
                onChange={(e) => handleSelectAllForExport(e.target.checked)}
                className="form-checkbox h-4 w-4 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="selectAllExport" className="text-sm text-foreground">Select All</label>
            </div>
          )}

          {/* Export to Excel Button */}
          <motion.button
            onClick={handleExportUsers}
            className="px-6 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Export users to Excel"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </motion.button>
        </div>
      </header>

      <main className="w-full max-w-6xl">
        {filteredUsers.length === 0 ? (
          <div className="text-center p-10 text-muted-foreground bg-card rounded-xl shadow-lg">
            <Info className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-body">No users found matching your criteria.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredUsers.map((user) => (
                <motion.div
                  key={user._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-xl shadow-md p-6 flex flex-col border border-border relative" // Added relative for absolute positioning of checkbox
                >
                  {exportSelectionType === "manual" && (
                    <div className="absolute top-4 left-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedUserIdsForExport.has(user._id)}
                        onChange={() => handleToggleSelectUserForExport(user._id)}
                        className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        user.isDeleted
                          ? "bg-destructive/20 text-destructive-foreground"
                          : user.isVerified
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.isDeleted ? (
                        <>
                          <CircleX className="w-4 h-4" /> Deleted
                        </>
                      ) : user.isVerified ? (
                        <>
                          <CircleCheck className="w-4 h-4" /> Active
                        </>
                      ) : (
                        <>
                          <Info className="w-4 h-4" /> Unverified
                        </>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground capitalize">
                      {getRoleIcon(user.role)} {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary">
                      <img
                        src={user.profileInfo?.avatar || "https://placehold.co/64x64/E0E0E0/9E9E9E?text=AD"}
                        alt={`${user.username} avatar`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/E0E0E0/9E9E9E?text=AD" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-bold text-foreground">
                        {user.profileInfo?.firstName && user.profileInfo?.lastName
                          ? `${user.profileInfo.firstName} ${user.profileInfo.lastName}`
                          : user.username}
                      </h3>
                      <p className="text-sm font-body text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <motion.button
                      onClick={() => handleViewUser(user._id)}
                      className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={`View ${user.username}`}
                    >
                      <Eye className="w-5 h-5" />
                    </motion.button>
                    {user.isDeleted ? (
                      <motion.button
                        onClick={() => handleActionClick(user, "restore")}
                        className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Restore ${user.username}`}
                      >
                        <Undo2 className="w-5 h-5" />
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => handleActionClick(user, "delete")}
                        className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Delete ${user.username}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && actionUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={handleCancelAction}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-card p-8 rounded-xl shadow-lg w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-heading text-foreground mb-4">
                Confirm Action
              </h2>
              <p className="text-muted-foreground font-body mb-6">
                Are you sure you want to {actionType}{" "}
                <strong className="text-foreground">
                  {actionUser.username}
                </strong>
                ? This action can be reversed.
              </p>
              <div className="flex justify-end gap-4">
                <motion.button
                  onClick={handleCancelAction}
                  className="px-6 py-2 rounded-md font-semibold transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleConfirmAction}
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    actionType === "delete"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/80"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {actionType === "delete" ? "Delete User" : "Restore User"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Details and Role Update Modal */}
      <AnimatePresence>
        {showRoleModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={handleCancelAction}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-card p-8 rounded-xl shadow-lg w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h2 className="text-2xl font-heading text-foreground font-bold">
                  User Details
                </h2>
                <motion.button
                  onClick={handleCancelAction}
                  className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CircleX />
                </motion.button>
              </div>
              {loadingSingleUser ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="ml-4 text-lg font-body">Fetching user details...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary">
                      <img
                        src={selectedUser.profileInfo?.avatar || "https://placehold.co/96x96/E0E0E0/9E9E9E?text=AD"}
                        alt={`${selectedUser.username} avatar`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/96x96/E0E0E0/9E9E9E?text=AD" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-heading font-bold text-foreground">
                        {selectedUser.profileInfo?.firstName && selectedUser.profileInfo?.lastName
                          ? `${selectedUser.profileInfo.firstName} ${selectedUser.profileInfo.lastName}`
                          : selectedUser.username}
                      </h3>
                      <p className="text-md font-body text-muted-foreground">{selectedUser.email}</p>
                      <p className="flex items-center gap-2 mt-1 text-sm font-body text-muted-foreground capitalize">
                        <span className="font-semibold text-foreground">Current Role:</span>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(selectedUser.role)} {selectedUser.role}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-heading font-bold text-foreground">Update Role</h4>
                    <div className="flex items-center gap-4">
                      <select
                        value={newRole || selectedUser.role}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="customercare">Customer Care</option>
                        <option value="admin">Admin</option>
                      </select>
                      <motion.button
                        onClick={handleUpdateRole}
                        disabled={newRole === selectedUser.role || !newRole}
                        className={`px-6 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 ${
                          newRole === selectedUser.role || !newRole
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/80"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Update <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManager;
