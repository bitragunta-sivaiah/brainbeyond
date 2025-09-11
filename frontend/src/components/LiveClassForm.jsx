// components/LiveClassForm.jsx

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createLiveClass, updateLiveClass } from "../store/redux/courseContentSlice";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const LiveClassForm = ({ liveClass, chapterId, onClose }) => {
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.courseContent);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        passcode: "", // for jitsiConfig.passcode
    });

    useEffect(() => {
        if (liveClass) {
            setFormData({
                title: liveClass.title || "",
                description: liveClass.description || "",
                // Format dates for datetime-local input
                startTime: liveClass.schedule?.startTime ? new Date(liveClass.schedule.startTime).toISOString().slice(0, 16) : "",
                endTime: liveClass.schedule?.endTime ? new Date(liveClass.schedule.endTime).toISOString().slice(0, 16) : "",
                passcode: liveClass.jitsiConfig?.passcode || "",
            });
        }
    }, [liveClass]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const liveClassData = {
            title: formData.title,
            description: formData.description,
            schedule: {
                startTime: formData.startTime,
                endTime: formData.endTime,
            },
            jitsiConfig: {
                passcode: formData.passcode,
            },
        };

        let result;
        if (liveClass) {
            result = await dispatch(updateLiveClass({ id: liveClass._id, liveClassData }));
        } else {
            result = await dispatch(createLiveClass({ chapterId, liveClassData }));
        }

        if (result.meta.requestStatus === 'fulfilled') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="bg-card text-foreground rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">{liveClass ? "Edit Live Class" : "Create Live Class"}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={20} /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full p-2 bg-input rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            id="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full p-2 bg-input rounded-md"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="startTime" className="block text-sm font-medium mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                id="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                className="w-full p-2 bg-input rounded-md"
                                required
                            />
                        </div>
                         <div>
                            <label htmlFor="endTime" className="block text-sm font-medium mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                name="endTime"
                                id="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                className="w-full p-2 bg-input rounded-md"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="passcode" className="block text-sm font-medium mb-1">Meeting Passcode (Optional)</label>
                        <input
                            type="text"
                            name="passcode"
                            id="passcode"
                            value={formData.passcode}
                            onChange={handleChange}
                            className="w-full p-2 bg-input rounded-md"
                            placeholder="e.g., secret123"
                        />
                    </div>
                    <footer className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            {loading ? 'Saving...' : (liveClass ? 'Update Class' : 'Create Class')}
                        </button>
                    </footer>
                </form>
            </motion.div>
        </div>
    );
};

export default LiveClassForm;