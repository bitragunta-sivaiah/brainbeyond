import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, GraduationCap, Briefcase, Headset, Trash2, Undo2, SquarePen, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { fetchAllUsers, softDeleteUser, restoreUser, updateUserRole, createUser } from '../../store/redux/authSlice';
import toast from 'react-hot-toast';

// Role configuration object for easy management
const roleConfig = {
    admin: { icon: <ShieldAlert className="w-5 h-5 text-red-500" />, color: 'bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400' },
    student: { icon: <GraduationCap className="w-5 h-5 text-blue-500" />, color: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-400' },
    instructor: { icon: <Briefcase className="w-5 h-5 text-purple-500" />, color: 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-400' },
    customercare: { icon: <Headset className="w-5 h-5 text-cyan-500" />, color: 'bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/30 dark:text-cyan-400' },
};

const UserManager = () => {
    const dispatch = useDispatch();
    const { users, isLoading, error } = useSelector((state) => state.auth);

    // Local state for UI interactions
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', role: 'student' });
    const [actionLoading, setActionLoading] = useState(false);
    const [createUserLoading, setCreateUserLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchAllUsers());
    }, [dispatch]);

    const sortedUsers = useMemo(() => {
        // Sort by deleted status first, then by role or username for consistency
        return [...users].sort((a, b) => {
            if (a.isDeleted !== b.isDeleted) {
                return a.isDeleted ? 1 : -1;
            }
            return a.username?.localeCompare(b.username);
        });
    }, [users]);

    const handleRefresh = useCallback(async () => {
        setActionLoading(true);
        try {
            await dispatch(fetchAllUsers()).unwrap();
            toast.success('User list refreshed.');
        } catch (err) {
            toast.error('Failed to refresh user list.');
        } finally {
            setActionLoading(false);
        }
    }, [dispatch]);

    const handleRoleChange = useCallback(async () => {
        if (!selectedUser || !newRole || newRole === selectedUser.role) return;

        setActionLoading(true);
        try {
            await dispatch(updateUserRole({ userId: selectedUser._id, newRole })).unwrap();
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to update user role:", err);
        } finally {
            setActionLoading(false);
        }
    }, [dispatch, selectedUser, newRole]);

    const handleDeleteUser = useCallback((userId, userName) => {
        if (window.confirm(`Are you sure you want to delete ${userName}? This action can be undone.`)) {
            dispatch(softDeleteUser(userId));
        }
    }, [dispatch]);

    const handleRestoreUser = useCallback((userId, userName) => {
        if (window.confirm(`Are you sure you want to restore ${userName}?`)) {
            dispatch(restoreUser(userId));
        }
    }, [dispatch]);

    const handleCreateUser = useCallback(async (e) => {
        e.preventDefault();
        setCreateUserLoading(true);
        try {
            await dispatch(createUser(newUser)).unwrap();
            setIsCreateModalOpen(false);
            setNewUser({ email: '', role: 'student' });
        } catch (err) {
            console.error("Failed to create user:", err);
        } finally {
            setCreateUserLoading(false);
        }
    }, [dispatch, newUser]);

    const openRoleModal = useCallback((user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsModalOpen(true);
    }, []);

    const RoleBadge = React.memo(({ role }) => {
        const config = roleConfig[role] || { icon: null, color: 'bg-gray-500/20 text-gray-700' };
        return (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium capitalize ${config.color}`}>
                {config.icon}
                <span>{role}</span>
            </div>
        );
    });
    
    // Add default values for potentially missing user fields
    const getUserDisplayName = (user) => user.profileInfo?.fullName || user.username || user.email;
    const getUserAvatar = (user) => user.profileInfo?.avatar || `https://via.placeholder.com/150/2c3e50/ffffff?text=${(user.username || user.email).charAt(0).toUpperCase()}`;

    if (isLoading && users.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-destructive font-medium bg-background">
                <p>Error: {error}</p>
                <p>Failed to load user data. Please try refreshing the page.</p>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-8 bg-background text-foreground min-h-screen">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tighter">
                        User Management
                    </h1>
                    <div className="flex items-center gap-2">
                        <motion.button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <UserPlus className="h-5 w-5" />
                            <span className="hidden sm:inline">Create User</span>
                        </motion.button>
                        <motion.button
                            onClick={handleRefresh}
                            className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={actionLoading}
                            title="Refresh User List"
                        >
                            {actionLoading && !isModalOpen ? <Loader2 className="h-6 w-6 animate-spin" /> : <RefreshCw className="h-6 w-6" />}
                        </motion.button>
                    </div>
                </div>

                <div className="bg-card shadow-lg rounded-xl overflow-hidden border border-border">
                    {sortedUsers.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground"><p>No users found.</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-secondary/50">
                                    <tr className="text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th scope="col" className="px-6 py-3">User</th>
                                        <th scope="col" className="px-6 py-3">Role & Status</th>
                                        <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <motion.tbody className="bg-card divide-y divide-border" layout>
                                    <AnimatePresence>
                                        {sortedUsers.map((user) => (
                                            <motion.tr 
                                                key={user._id} // Use a stable unique key like _id
                                                className={`transition-colors ${user.isDeleted ? 'bg-muted/30 opacity-60' : 'hover:bg-muted/50'}`}
                                                layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-3">
                                                        <img className="w-10 h-10 rounded-full object-cover" src={getUserAvatar(user)} alt={getUserDisplayName(user)} />
                                                        <div>
                                                            <div className="text-base font-semibold text-foreground">{getUserDisplayName(user)}</div>
                                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-2">
                                                        <RoleBadge role={user.role} />
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isVerified ? 'bg-blue-500/20 text-blue-700' : 'bg-gray-500/20 text-gray-700'}`}>{user.isVerified ? 'Verified' : 'Unverified'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        {user.isDeleted ? (
                                                            <button onClick={() => handleRestoreUser(user._id, getUserDisplayName(user))} className="p-2 rounded-full text-green-500 hover:bg-green-500/10" title="Restore User"><Undo2 className="w-5 h-5" /></button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => openRoleModal(user)} className="p-2 rounded-full text-blue-500 hover:bg-blue-500/10" title="Change Role"><SquarePen className="w-5 h-5" /></button>
                                                                <button onClick={() => handleDeleteUser(user._id, getUserDisplayName(user))} className="p-2 rounded-full text-red-500 hover:bg-red-500/10" title="Delete User (Soft)"><Trash2 className="w-5 h-5" /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </motion.tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Change Role Modal */}
            <AnimatePresence>
                {isModalOpen && selectedUser && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)}>
                        <motion.div className="bg-card text-foreground p-8 rounded-xl shadow-2xl max-w-md w-full m-4 border border-border" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold mb-2 text-primary">Change User Role</h2>
                            <p className="text-muted-foreground mb-6">Select a new role for <span className="font-semibold text-foreground">{getUserDisplayName(selectedUser)}</span>.</p>
                            <select
                                id="user-role"
                                className="w-full p-3 rounded-md border border-border bg-input focus:ring-2 focus:ring-primary"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                disabled={actionLoading}
                            >
                                {Object.keys(roleConfig).map(role => (
                                    <option key={role} value={role} className="capitalize">{role}</option>
                                ))}
                            </select>
                            <div className="flex justify-end space-x-4 mt-8">
                                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-md font-semibold text-muted-foreground bg-muted hover:bg-muted/80" disabled={actionLoading}>Cancel</button>
                                <button
                                    onClick={handleRoleChange}
                                    className="px-6 py-2 rounded-md font-semibold text-primary-foreground bg-primary hover:bg-primary/90 flex items-center justify-center min-w-[150px]"
                                    disabled={actionLoading || newRole === selectedUser.role}
                                >
                                    {actionLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Change'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Create User Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)}>
                        <motion.div className="bg-card text-foreground p-8 rounded-xl shadow-2xl max-w-md w-full m-4 border border-border" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold mb-2 text-primary">Create New User</h2>
                            <p className="text-muted-foreground mb-6">A temporary password will be sent to the user's email.</p>
                            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full p-3 rounded-md border border-border bg-input focus:ring-2 focus:ring-primary"
                                        placeholder="user@example.com"
                                        required
                                        disabled={createUserLoading}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
                                    <select
                                        id="role"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full p-3 rounded-md border border-border bg-input focus:ring-2 focus:ring-primary"
                                        disabled={createUserLoading}
                                    >
                                        {Object.keys(roleConfig).map(role => (
                                            <option key={role} value={role} className="capitalize">{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-4 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-6 py-2 rounded-md font-semibold text-muted-foreground bg-muted hover:bg-muted/80"
                                        disabled={createUserLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-md font-semibold text-primary-foreground bg-primary hover:bg-primary/90 flex items-center justify-center min-w-[150px]"
                                        disabled={createUserLoading}
                                    >
                                        {createUserLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManager;