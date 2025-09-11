import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, children }) => {
  // Close modal on escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75 transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-6 transform transition-all scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Close"
        >
          <FaTimes className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;