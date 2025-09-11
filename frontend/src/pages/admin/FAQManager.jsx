import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAdminFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  updateFAQOrder,
} from '../../store/redux/faqSlice'; // Adjust the import path as needed
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Reusable component for each draggable FAQ item
const SortableItem = ({ id, faq, onEdit, onDelete, onPublishToggle, isEditing }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={style}
      className={`relative p-4 rounded-xl bg-card shadow-md border border-border mb-4 transition-transform ease-in-out ${
        isDragging ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 flex-grow">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <span className="text-lg font-heading text-foreground">{faq.question}</span>
        </div>
        <div className="flex items-center gap-2">
          {faq.isPublished ? (
            <span className="flex items-center gap-1 text-accent-foreground text-sm">
              <CheckCircle className="w-4 h-4" /> Published
            </span>
          ) : (
            <span className="flex items-center gap-1 text-destructive text-sm">
              <XCircle className="w-4 h-4" /> Unpublished
            </span>
          )}
          <button
            type="button"
            className="p-1 rounded-md text-muted-foreground hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card from expanding
              onEdit(faq);
            }}
            disabled={isEditing}
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-md text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(faq._id);
            }}
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="p-1 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4 pt-4 border-t border-border text-muted-foreground font-body"
          >
            <p>{faq.answer}</p>
            <span className="block mt-2 text-sm text-muted-foreground">
              Category: {faq.category}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQManager = () => {
  const dispatch = useDispatch();
  const { faqs, loading, error } = useSelector((state) => state.faq);

  const [isEditing, setIsEditing] = useState(false);
  const [currentFAQ, setCurrentFAQ] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    isPublished: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    dispatch(fetchAdminFAQs());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.question || !formData.answer || !formData.category) {
      toast.error('All fields are required.');
      return;
    }
    await dispatch(createFAQ(formData));
    setFormData({ question: '', answer: '', category: '', isPublished: true });
    setIsEditing(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.question || !formData.answer || !formData.category) {
      toast.error('All fields are required.');
      return;
    }
    await dispatch(updateFAQ({ ...formData, _id: currentFAQ._id }));
    setCurrentFAQ(null);
    setIsEditing(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      await dispatch(deleteFAQ(id));
    }
  };

  const handleEditClick = (faq) => {
    setIsEditing(true);
    setCurrentFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isPublished: faq.isPublished,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentFAQ(null);
    setFormData({ question: '', answer: '', category: '', isPublished: true });
  };

  // Drag and Drop Logic
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = faqs.findIndex((faq) => faq._id === active.id);
      const newIndex = faqs.findIndex((faq) => faq._id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return;

      const items = [...faqs];
      const [movedItem] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, movedItem);

      // Create a payload with the new order
      const newOrder = items.map((faq, index) => ({
        _id: faq._id,
        order: index,
      }));

      dispatch(updateFAQOrder(newOrder));
    }
  };

  const faqItems = useMemo(() => faqs.map((faq) => faq._id), [faqs]);

  if (loading && !faqs.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-8 bg-background font-body text-foreground min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-heading">FAQ Manager</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add New FAQ</span>
            </button>
          )}
        </div>

        {/* Form for Creating/Editing FAQ */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 p-6 rounded-xl bg-card shadow-md border border-border overflow-hidden"
            >
              <h2 className="text-2xl font-heading mb-4">
                {currentFAQ ? 'Edit FAQ' : 'Create New FAQ'}
              </h2>
              <form onSubmit={currentFAQ ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Question</label>
                  <input
                    type="text"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Enter the question"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Answer</label>
                  <textarea
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
                    placeholder="Enter the answer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g., General, Payment, Technical"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="isPublished" className="text-sm font-medium">
                    Published
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    className="flex-grow flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{currentFAQ ? 'Save Changes' : 'Create FAQ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-grow flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ List for Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={faqItems} strategy={verticalListSortingStrategy}>
            {faqs.length > 0 ? (
              faqs.map((faq) => (
                <SortableItem
                  key={faq._id}
                  id={faq._id}
                  faq={faq}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                  isEditing={isEditing}
                />
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground rounded-xl bg-card shadow-md border border-border">
                {loading ? 'Loading FAQs...' : 'No FAQs found. Click "Add New FAQ" to get started.'}
              </div>
            )}
          </SortableContext>
        </DndContext>
      </motion.div>
    </div>
  );
};

export default FAQManager;