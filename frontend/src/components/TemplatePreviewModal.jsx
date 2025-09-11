// src/components/TemplatePreviewModal.js

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const TemplatePreviewModal = ({ isOpen, onClose, template }) => {
  if (!isOpen || !template) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-fit   p-4"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-110"
              aria-label="Close preview"
            >
              <X size={24} />
            </button>
            <div className="overflow-hidden h-[90vh] rounded-xl shadow-xl">
              <img
                src={template.thumbnail}
                alt={`${template.name} Template Preview`}
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TemplatePreviewModal;