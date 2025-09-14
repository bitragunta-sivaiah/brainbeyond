import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, softDeleteUser, restoreUser, updateUserRole, adminUpdateUser } from '../../store/redux/authSlice';
import {
  ShieldCheck,
  User,
  Trash2,
  Undo2,
  Edit,
  UserPlus,
  X,
  Search,
  ChevronDown,
} from 'lucide-react';
import { FaUserGraduate, FaChalkboardTeacher, FaUserTie, FaUsers } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const UserRoleIcon = ({ role }) => {
  switch (role) {
    case 'admin':
      return <ShieldCheck className="text-destructive" size={18} />;
    case 'student':
      return <FaUserGraduate className="text-custom" size={18} />;
    case 'instructor':
      return <FaChalkboardTeacher className="text-custom" size={18} />;
    case 'customercare':
      return <FaUserTie className="text-custom" size={18} />;
    default:
      return <User className="text-custom" size={18} />;
  }
};

const AdminUserManager = () => {
  const dispatch = useDispatch();
  const { users, isLoading, error } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleUpdate = (user) => {
    setCurrentUser(user);
    setNewRole(user.role);
    setIsModalOpen(true);
  };

  const handleRoleChange = (role) => {
    setNewRole(role);
    setShowRoleDropdown(false);
  };

  const handleSave = () => {
    if (!currentUser) return;

    if (newRole !== currentUser.role) {
      dispatch(updateUserRole({ userId: currentUser._id, newRole }))
        .then(() => {
          setIsModalOpen(false);
        });
    } else {
      toast.error('No changes to save.');
    }
  };

  const softDeleteHandler = (userId) => {
    if (window.confirm('Are you sure you want to soft delete this user?')) {
      dispatch(softDeleteUser(userId));
    }
  };

  const restoreHandler = (userId) => {
    if (window.confirm('Are you sure you want to restore this user?')) {
      dispatch(restoreUser(userId));
    }
  };

  const roles = ['admin', 'student', 'instructor', 'customercare'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-foreground">
        <FaUsers className="animate-pulse text-primary" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-destructive p-4">Error: {error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-10 bg-background min-h-screen text-foreground font-body"
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-tight">User Management</h1>
        <p className="text-custom text-lg mb-8">
          Manage all registered users, including their roles, status, and permissions.
        </p>

        <div className="bg-card p-6 rounded-2xl shadow-md mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
            <div className="w-full md:w-1/2 relative">
              <label htmlFor="role-filter" className="sr-only">Filter by Role</label>
              <select
                id="role-filter"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-lg bg-muted text-foreground border border-border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="customercare">Customer Care</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left table-auto border-collapse">
              <thead className="bg-secondary text-secondary-foreground uppercase text-sm">
                <tr>
                  <th className="p-4 rounded-tl-xl rounded-bl-xl">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-b last:border-b-0 border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profileInfo?.avatar}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover shadow-sm"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{user.username}</p>
                            <p className="text-sm text-custom">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <UserRoleIcon role={user.role} />
                          <span className={`capitalize font-medium ${user.role === 'admin' ? 'text-destructive' : 'text-foreground'}`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive && !user.isDeleted ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
                          {user.isDeleted ? 'Deleted' : (user.isActive ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdate(user)}
                            className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
                            aria-label={`Edit ${user.username}`}
                            title="Edit User"
                          >
                            <Edit size={20} />
                          </button>
                          {user.isDeleted ? (
                            <button
                              onClick={() => restoreHandler(user._id)}
                              className="p-2 rounded-full text-accent-foreground hover:bg-accent/10 transition-colors"
                              aria-label={`Restore ${user.username}`}
                              title="Restore User"
                            >
                              <Undo2 size={20} />
                            </button>
                          ) : (
                            <button
                              onClick={() => softDeleteHandler(user._id)}
                              className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                              aria-label={`Delete ${user.username}`}
                              title="Soft Delete User"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-custom">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-card p-8 rounded-2xl shadow-2xl max-w-lg w-full relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
              <h2 className="text-3xl font-heading font-bold mb-6 text-foreground">Edit User: {currentUser.username}</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="role" className="block text-custom font-medium mb-1">
                    Change Role
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      className="w-full text-left bg-muted p-3 rounded-lg border border-border flex items-center justify-between"
                    >
                      <span className="capitalize">{newRole}</span>
                      <ChevronDown size={20} className={`transform transition-transform ${showRoleDropdown ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    <AnimatePresence>
                      {showRoleDropdown && (
                        <motion.ul
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute w-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10"
                        >
                          {roles.map((role) => (
                            <li key={role}>
                              <button
                                onClick={() => handleRoleChange(role)}
                                className="w-full text-left p-3 hover:bg-muted/50 capitalize transition-colors"
                              >
                                {role}
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    className="w-full p-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full p-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminUserManager;