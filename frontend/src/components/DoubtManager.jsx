import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addReplyToDoubt, resolveDoubt } from '../store/redux/courseContentSlice';
import { toast } from 'react-hot-toast';
import { CheckCircle, Reply, MessageSquare, X } from 'lucide-react'; // Added X for close button
import { motion, AnimatePresence } from 'framer-motion';

const DoubtManager = ({ doubts, lessonId, onClose, userRole, currentUserId }) => {
    const dispatch = useDispatch();
    const [replyText, setReplyText] = useState('');
    const [activeDoubt, setActiveDoubt] = useState(null);

    const handleReply = async (doubtId) => {
        if (!replyText.trim()) {
            toast.error("Reply cannot be empty.");
            return;
        }
        try {
            await dispatch(addReplyToDoubt({
                lessonId,
                doubtId,
                replyData: { content: replyText }
            })).unwrap();
            setReplyText('');
            setActiveDoubt(null);
            toast.success("Reply added successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to add reply.");
        }
    };

    const handleResolve = async (doubtId) => {
        try {
            await dispatch(resolveDoubt({ lessonId, doubtId })).unwrap();
            toast.success("Doubt resolved successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to resolve doubt.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
            <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-2xl font-bold font-heading">Manage Doubts</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={24} />
                    </button>
                </div>
                <div className="mt-4 space-y-4">
                    {doubts.length > 0 ? (
                        doubts.map((doubt) => (
                            <motion.div
                                key={doubt._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`p-4 rounded-lg shadow-sm transition-all ${
                                    doubt.status === 'resolved' ? 'bg-green-50/20 border border-green-200' : 'bg-muted/30 border border-border'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-bold text-foreground">{doubt.user?.username || 'Student'}</p>
                                        <p className="text-sm text-muted-foreground">{new Date(doubt.createdAt).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        doubt.status === 'resolved' ? 'bg-green-200 text-green-800' :
                                        doubt.status === 'answered' ? 'bg-blue-200 text-blue-800' :
                                        'bg-yellow-200 text-yellow-800'
                                    }`}>
                                        {doubt.status}
                                    </span>
                                </div>
                                <p className="text-foreground my-2">{doubt.question}</p>

                                {doubt.answers && doubt.answers.length > 0 && (
                                    <div className="mt-4 pl-4 border-l-2 border-border space-y-2">
                                        {doubt.answers.map((answer, index) => (
                                            <div key={index} className="bg-card p-3 rounded-lg shadow-sm border border-border">
                                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                                                    <p className="font-semibold">{answer.user?.username || 'Instructor'}</p>
                                                    <p>{new Date(answer.createdAt).toLocaleString()}</p>
                                                </div>
                                                <p className="text-foreground">{answer.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(userRole === 'instructor' || userRole === 'admin' || (doubt.user?._id === currentUserId && doubt.status !== 'resolved')) && (
                                    <div className="flex gap-2 mt-4">
                                        {(userRole === 'instructor' || userRole === 'admin') && (
                                            <button
                                                onClick={() => setActiveDoubt(activeDoubt === doubt._id ? null : doubt._id)}
                                                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                            >
                                                <Reply size={16} /> Reply
                                            </button>
                                        )}
                                        {doubt.status !== 'resolved' && (doubt.user?._id === currentUserId || userRole === 'instructor' || userRole === 'admin') && (
                                            <button
                                                onClick={() => handleResolve(doubt._id)}
                                                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                            >
                                                <CheckCircle size={16} /> Resolve
                                            </button>
                                        )}
                                    </div>
                                )}
                                <AnimatePresence>
                                    {activeDoubt === doubt._id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 overflow-hidden"
                                        >
                                            <textarea
                                                className="w-full p-2 border rounded-lg resize-none bg-input text-foreground border-border focus:ring-primary focus:border-primary"
                                                rows="3"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write your reply here..."
                                            ></textarea>
                                            <button
                                                onClick={() => handleReply(doubt._id)}
                                                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Submit Reply
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground">No doubts for this lesson.</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default DoubtManager;
