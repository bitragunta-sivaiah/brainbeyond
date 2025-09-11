import React, { memo } from "react";
import { useFieldArray, useController } from "react-hook-form";
import {
  User, Briefcase, GraduationCap, Sparkles, Award, BookMarked,
  Code, Plus, Trash2, PlusSquare, ChevronDown, Save, Download,
  RefreshCcw, Bot, LayoutTemplate, Eye
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

// --- UI Components (Defined in-file to resolve import error) ---

const Input = ({ name, control, label, type = "text", placeholder, required }) => {
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="flex flex-col">
      {label && <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>}
      <input
        {...field}
        type={type}
        placeholder={placeholder}
        className={clsx(
          "px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          fieldState.error ? "border-red-500" : "border-gray-300"
        )}
      />
      {fieldState.error && <span className="text-red-500 text-sm mt-1">{fieldState.error.message}</span>}
    </div>
  );
};

const Textarea = ({ name, control, label, rows = 3, placeholder }) => {
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="flex flex-col">
       {label && <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        {...field}
        rows={rows}
        placeholder={placeholder}
        className={clsx(
            "px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            fieldState.error ? "border-red-500" : "border-gray-300"
        )}
      />
      {fieldState.error && <span className="text-red-500 text-sm mt-1">{fieldState.error.message}</span>}
    </div>
  );
};

const Button = ({ children, onClick, type = "button", variant = "primary", size = "md", className, disabled }) => {
    const baseClasses = "font-semibold rounded-md flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400"
    };
    const sizeClasses = {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        icon: "p-2",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        >
            {children}
        </button>
    );
};

const Checkbox = ({ name, control, label }) => {
  const { field } = useController({ name, control });
  return (
    <div className="flex items-center">
      <input
        {...field}
        type="checkbox"
        checked={field.value || false}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label className="ml-2 block text-sm text-gray-900">{label}</label>
    </div>
  );
};

const DatePicker = ({ name, control, label }) => {
  const { field } = useController({ name, control });
  return (
    <div className="flex flex-col w-full">
      <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>
      <input
        {...field}
        type="date"
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
      />
    </div>
  );
};

const Select = ({ name, control, label, children }) => {
  const { field } = useController({ name, control });
  return (
     <div className="flex flex-col">
      {label && <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>}
      <select
        {...field}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {children}
      </select>
    </div>
  );
};


// --- Helper Component for Repeatable Fields ---
const FieldArrayComponent = ({
  name,
  control,
  sectionTitle,
  fieldComponents,
  defaultAppendValue = {},
  isNested = false,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const containerClass = isNested
    ? "pl-4 border-l-2 border-gray-200 space-y-4"
    : "space-y-4";

  return (
    <div className={containerClass}>
      <AnimatePresence mode="popLayout">
        {fields.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-semibold text-gray-800">
                {sectionTitle} {index + 1}
              </h4>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => remove(index)}
                className="text-red-500 hover:bg-red-100"
              >
                <Trash2 size={16} />
              </Button>
            </div>
            <div className="space-y-4">{fieldComponents(index)}</div>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button
        type="button"
        onClick={() => append(defaultAppendValue)}
        variant="outline"
        className="w-full"
      >
        <Plus size={16} className="mr-2" /> Add {sectionTitle}
      </Button>
    </div>
  );
};

// --- Section Definitions ---
const sections = [
  { id: "contact", label: "Contact", icon: <User size={18} /> },
  { id: "summary", label: "Summary", icon: <BookMarked size={18} /> },
  { id: "workExperience", label: "Work Experience", icon: <Briefcase size={18} /> },
  { id: "education", label: "Education", icon: <GraduationCap size={18} /> },
  { id: "projects", label: "Projects", icon: <Code size={18} /> },
  { id: "skills", label: "Skills", icon: <Sparkles size={18} /> },
  { id: "certifications", label: "Certifications", icon: <Award size={18} /> },
  { id: "achievements", label: "Achievements", icon: <Award size={18} /> },
  { id: "customSections", label: "Custom Sections", icon: <PlusSquare size={18} /> },
];


// --- Main Sidebar Component ---
const Sidebar = memo(({ 
    activeTab, 
    setActiveTab, 
    control,
    onSave,
    isSaving,
    onDownload,
    onLoadMockData,
    onClearForm,
    onAtsTools,
    onSelectTemplate,
    onPreviewMobile,
}) => {
  // This function contains the form fields for each section
  const renderSection = (tabId) => {
    switch (tabId) {
      case "contact":
        return (
          <div className="space-y-4">
            <Input name="fileName" label="Resume Title / File Name" control={control} />
            <Input name="contact.firstName" label="First Name" control={control} />
            <Input name="contact.lastName" label="Last Name" control={control} />
            <Input name="contact.professionalTitle" label="Professional Title" control={control} />
            <Input name="contact.email" label="Email" type="email" control={control} />
            <Input name="contact.phone" label="Phone" type="tel" control={control} />
            <Input name="contact.website" label="Website/Portfolio" type="url" control={control} />
            <h4 className="text-md font-semibold pt-2">Address</h4>
            <Input name="contact.address.street" label="Street" control={control} />
            <Input name="contact.address.city" label="City" control={control} />
            <Input name="contact.address.state" label="State" control={control} />
            <Input name="contact.address.zipCode" label="Zip Code" control={control} />
            <Input name="contact.address.country" label="Country" control={control} />
            <div className="pt-2">
              <FieldArrayComponent
                name="contact.socialLinks"
                control={control}
                sectionTitle="Social Link"
                fieldComponents={(index) => (
                  <>
                    <Input name={`contact.socialLinks.${index}.platform`} label="Platform" control={control} />
                    <Input name={`contact.socialLinks.${index}.url`} label="URL" type="url" control={control} />
                  </>
                )}
              />
            </div>
          </div>
        );

      case "summary":
        return (
          <Textarea name="summary" label="Professional Summary" control={control} rows={8} placeholder="A brief, powerful summary of your skills and experience." />
        );

      case "workExperience":
        return (
          <FieldArrayComponent
            name="workExperience"
            control={control}
            sectionTitle="Work Experience"
            fieldComponents={(index) => (
              <>
                <Input name={`workExperience.${index}.jobTitle`} label="Job Title" control={control} />
                <Input name={`workExperience.${index}.company`} label="Company" control={control} />
                <Input name={`workExperience.${index}.location`} label="Location" control={control} />
                <div className="flex gap-4">
                  <DatePicker name={`workExperience.${index}.startDate`} label="Start Date" control={control} />
                  <DatePicker name={`workExperience.${index}.endDate`} label="End Date" control={control} />
                </div>
                <Checkbox name={`workExperience.${index}.isCurrent`} label="I currently work here" control={control} />
                <FieldArrayComponent
                  name={`workExperience.${index}.description`}
                  control={control}
                  sectionTitle="Description Point"
                  defaultAppendValue={""}
                  isNested={true}
                  fieldComponents={(descIndex) => (
                    <Input name={`workExperience.${index}.description.${descIndex}`} label={null} control={control} placeholder="e.g., Developed a new feature..." />
                  )}
                />
              </>
            )}
          />
        );

      case "education":
        return (
          <FieldArrayComponent
            name="education"
            control={control}
            sectionTitle="Education"
            fieldComponents={(index) => (
              <>
                <Input name={`education.${index}.institution`} label="Institution" control={control} />
                <Input name={`education.${index}.degree`} label="Degree" control={control} />
                <Input name={`education.${index}.fieldOfStudy`} label="Field of Study" control={control} />
                <div className="flex gap-4">
                  <DatePicker name={`education.${index}.startDate`} label="Start Date" control={control} />
                  <DatePicker name={`education.${index}.endDate`} label="End Date" control={control} />
                </div>
                <Checkbox name={`education.${index}.isCurrent`} label="I'm currently enrolled" control={control} />
                <div className="flex gap-4 items-end">
                  <div className="flex-grow">
                    <Input name={`education.${index}.gpa.value`} label="Score" control={control} />
                  </div>
                  <div className="flex-grow">
                    <Select name={`education.${index}.gpa.type`} label="Type" control={control}>
                      <option value="">Select Type...</option>
                      <option value="GPA">GPA</option>
                      <option value="CGPA">CGPA</option>
                      <option value="Percentage">Percentage</option>
                      <option value="Marks">Marks</option>
                    </Select>
                  </div>
                </div>
              </>
            )}
          />
        );

      case "projects":
        return (
          <FieldArrayComponent
            name="projects"
            control={control}
            sectionTitle="Project"
            fieldComponents={(index) => (
              <>
                <Input name={`projects.${index}.name`} label="Project Name" control={control} />
                <FieldArrayComponent
                  name={`projects.${index}.links`}
                  control={control}
                  sectionTitle="Link"
                  isNested={true}
                  fieldComponents={(linkIndex) => (
                    <>
                      <Input name={`projects.${index}.links.${linkIndex}.name`} label="Link Name (e.g., GitHub, Live Demo)" control={control} />
                      <Input name={`projects.${index}.links.${linkIndex}.url`} label="URL" type="url" control={control} />
                    </>
                  )}
                />
                <FieldArrayComponent
                  name={`projects.${index}.description`}
                  control={control}
                  sectionTitle="Description Point"
                  defaultAppendValue={""}
                  isNested={true}
                  fieldComponents={(descIndex) => (
                    <Input name={`projects.${index}.description.${descIndex}`} control={control} placeholder="e.g., Developed a full-stack web application..." />
                  )}
                />
                <FieldArrayComponent
                  name={`projects.${index}.technologiesUsed`}
                  control={control}
                  sectionTitle="Technology"
                  defaultAppendValue={""}
                  isNested={true}
                  fieldComponents={(techIndex) => (
                    <Input name={`projects.${index}.technologiesUsed.${techIndex}`} control={control} placeholder="e.g., React, Node.js, MongoDB" />
                  )}
                />
              </>
            )}
          />
        );

      case "skills":
        return (
          <FieldArrayComponent
            name="skills"
            control={control}
            sectionTitle="Skills Category"
            fieldComponents={(index) => (
              <>
                <Input name={`skills.${index}.category`} label="Category (e.g., Programming Languages)" control={control} />
                <FieldArrayComponent
                  name={`skills.${index}.items`}
                  control={control}
                  sectionTitle="Skill"
                  defaultAppendValue={""}
                  isNested={true}
                  fieldComponents={(itemIndex) => (
                    <Input name={`skills.${index}.items.${itemIndex}`} control={control} placeholder="e.g., JavaScript" />
                  )}
                />
              </>
            )}
          />
        );

      case "certifications":
        return (
          <FieldArrayComponent
            name="certifications"
            control={control}
            sectionTitle="Certification"
            fieldComponents={(index) => (
              <>
                <Input name={`certifications.${index}.name`} label="Name" control={control} />
                <Input name={`certifications.${index}.issuingOrganization`} label="Issuing Organization" control={control} />
                <DatePicker name={`certifications.${index}.issueDate`} label="Issue Date" control={control} />
                <Input name={`certifications.${index}.credentialUrl`} label="Credential URL" type="url" control={control} />
              </>
            )}
          />
        );

      case "achievements":
        return (
          <FieldArrayComponent
            name="achievements"
            control={control}
            sectionTitle="Achievement"
            fieldComponents={(index) => (
              <>
                <Input name={`achievements.${index}.title`} label="Title" control={control} />
                <Input name={`achievements.${index}.issuer`} label="Issuer" control={control} />
                <DatePicker name={`achievements.${index}.date`} label="Date" control={control} />
                <Textarea name={`achievements.${index}.description`} label="Description" control={control} rows={3} />
              </>
            )}
          />
        );

      case "customSections":
        return (
          <FieldArrayComponent
            name="customSections"
            control={control}
            sectionTitle="Custom Section"
            fieldComponents={(index) => (
              <>
                <Input name={`customSections.${index}.sectionTitle`} label="Section Title" control={control} />
                <FieldArrayComponent
                  name={`customSections.${index}.items`}
                  control={control}
                  sectionTitle="Item"
                  isNested={true}
                  fieldComponents={(itemIndex) => (
                    <>
                      <Input name={`customSections.${index}.items.${itemIndex}.title`} label="Title" control={control} />
                      <Input name={`customSections.${index}.items.${itemIndex}.subTitle`} label="Subtitle" control={control} />
                      <div className="flex gap-4">
                        <DatePicker name={`customSections.${index}.items.${itemIndex}.startDate`} label="Start Date" control={control} />
                        <DatePicker name={`customSections.${index}.items.${itemIndex}.endDate`} label="End Date" control={control} />
                      </div>
                      <FieldArrayComponent
                        name={`customSections.${index}.items.${itemIndex}.description`}
                        control={control}
                        sectionTitle="Description Point"
                        defaultAppendValue={""}
                        isNested={true}
                        fieldComponents={(descIndex) => (
                           <Input name={`customSections.${index}.items.${itemIndex}.description.${descIndex}`} control={control} placeholder="Detail or accomplishment..." />
                        )}
                      />
                      <FieldArrayComponent
                        name={`customSections.${index}.items.${itemIndex}.links`}
                        control={control}
                        sectionTitle="Link"
                        isNested={true}
                        fieldComponents={(linkIndex) => (
                          <>
                            <Input name={`customSections.${index}.items.${itemIndex}.links.${linkIndex}.name`} label="Link Name" control={control} />
                            <Input name={`customSections.${index}.items.${itemIndex}.links.${linkIndex}.url`} label="URL" type="url" control={control} />
                          </>
                        )}
                      />
                    </>
                  )}
                />
              </>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            <div className="grid grid-cols-2 gap-2">
                <Button onClick={onSave} disabled={isSaving} variant="primary" className="w-full col-span-2">
                    <Save size={16} className="mr-2" /> {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button onClick={onDownload} variant="secondary" className="w-full">
                    <Download size={16} className="mr-2" /> Download
                </Button>
                <Button onClick={onSelectTemplate} variant="secondary" className="w-full">
                    <LayoutTemplate size={16} className="mr-2" /> Template
                </Button>
                 <Button onClick={onPreviewMobile} variant="secondary" className="w-full md:hidden">
                    <Eye size={16} className="mr-2" /> Preview
                </Button>
                <Button onClick={onAtsTools} variant="secondary" className="w-full col-span-2">
                     <Bot size={16} className="mr-2" /> ATS Tools
                </Button>
                <Button onClick={onLoadMockData} variant="outline" className="w-full text-sm">
                     <Sparkles size={16} className="mr-2" /> Load Mock
                </Button>
                <Button onClick={onClearForm} variant="outline" className="w-full text-sm">
                    <RefreshCcw size={16} className="mr-2" /> Clear All
                </Button>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto">
            <h2 className="text-xl font-bold my-4 px-4">Resume Sections</h2>
            <div className="flex flex-col">
                {sections.map((section) => {
                    const isActive = activeTab === section.id;
                    return (
                        <div key={section.id} className="border-b border-gray-200 last:border-b-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab(isActive ? null : section.id)}
                                className="flex items-center justify-between w-full p-4 text-left transition-colors duration-200 text-gray-600 hover:bg-gray-100"
                            >
                                <div className="flex items-center">
                                    {React.cloneElement(section.icon, {
                                        className: clsx("mr-3", isActive ? "text-blue-600" : ""),
                                        strokeWidth: isActive ? 2.5 : 2,
                                    })}
                                    <span className={clsx("font-medium", isActive ? "text-blue-600" : "text-gray-800")}>
                                        {section.label}
                                    </span>
                                </div>
                                <motion.div
                                    animate={{ rotate: isActive ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown size={18} />
                                </motion.div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isActive && (
                                    <motion.div
                                        key="content"
                                        initial="collapsed"
                                        animate="open"
                                        exit="collapsed"
                                        variants={{
                                            open: { opacity: 1, height: "auto" },
                                            collapsed: { opacity: 0, height: 0 },
                                        }}
                                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-2 bg-white">
                                            {renderSection(section.id)}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

