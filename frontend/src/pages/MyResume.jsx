import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchResumes, deleteResume } from "../store/redux/resumeSlice";
import { FileText, Edit, Trash2, PlusCircle, Loader2, RefreshCcw } from "lucide-react"; // RefreshCcw imported here
import toast from "react-hot-toast";
import { format } from "date-fns";
// Removed: import { Button } from "@/components/ui"; // Assuming you have a Button component

const MyResumes = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { resumes, loading, error } = useSelector((state) => state.resume);
  const { user } = useSelector((state) => state.auth); // Assuming user is available in auth slice

  useEffect(() => {
    // Only fetch resumes if a user is logged in
    if (user) {
      dispatch(fetchResumes());
    } else {
      toast.error("Please log in to view your resumes.");
      // Optionally redirect to login page
      // navigate('/login');
    }
  }, [dispatch, user]);

  const handleDelete = async (resumeId, fileName) => {
    // A simple confirmation before deleting
    // It's recommended to replace window.confirm with a custom modal for better UX
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      try {
        await dispatch(deleteResume(resumeId)).unwrap();
        toast.success(`Resume "${fileName}" deleted successfully!`);
      } catch (err) {
        toast.error(`Failed to delete resume: ${err}`);
        console.error("Delete failed:", err);
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="ml-4 text-lg text-muted-foreground">Loading your resumes...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center text-destructive-foreground">
          <p className="text-lg">Error loading resumes: {error}</p>
          <button
            onClick={() => dispatch(fetchResumes())}
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 hover:bg-primary/80 flex items-center justify-center" // Added Tailwind classes
          >
            <RefreshCcw size={16} className="mr-2" /> Try Again
          </button>
        </div>
      );
    }

    if (!resumes || resumes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText size={48} className="text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-muted-foreground mb-4">No resumes found.</p>
          <p className="text-md text-muted-foreground mb-6">It looks like you haven't created any resumes yet.</p>
          <button
            onClick={() => navigate("/create-resume")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 hover:bg-primary/80 flex items-center justify-center" // Added Tailwind classes
          >
            <PlusCircle size={20} className="mr-2" /> Create Your First Resume
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes.map((resume) => (
          <div
            key={resume._id}
            className="bg-card border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-2">{resume.fileName || "Untitled Resume"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Last updated: {resume.updatedAt ? format(new Date(resume.updatedAt), "PPP") : "N/A"}
              </p>
              <div className="flex justify-end space-x-3">
                <Link to={`/resumes/${resume._id}`} className="flex items-center text-primary hover:underline">
                  <Edit size={16} className="mr-1" /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(resume._id, resume.fileName)}
                  className="flex items-center text-destructive-foreground hover:underline"
                >
                  <Trash2 size={16} className="mr-1" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center">
          <FileText size={32} className="mr-3" /> Resumes
        </h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default MyResumes;
