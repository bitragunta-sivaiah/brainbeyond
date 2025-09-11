import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

const TemplateSelector = ({ templates, activeTemplate, setActiveTemplate ,onPreview}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 ">
      {templates.map((template) => (
        <motion.div
          key={template.id}
          onDoubleClick={() => onPreview(template)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTemplate(template)}
          className={clsx(
            "relative w-40 cursor-pointer overflow-hidden rounded-lg border-2 p-1 shadow-md transition-all duration-200",
            activeTemplate.id === template.id
              ? "border-primary ring-2 ring-primary ring-offset-2"
              : "border-transparent hover:border-border"
          )}
        >
          <img
            src={template.thumbnail}
            alt={`${template.name} thumbnail`}
            className="w-full rounded-sm"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 hover:opacity-100">
            <span className="text-sm font-semibold text-primary">
              {template.name}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TemplateSelector;