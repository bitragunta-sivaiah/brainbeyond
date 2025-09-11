// src/components/resume-builder/ResumeForm.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, UploadCloud, Link } from 'lucide-react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { uploadSingleFile } from '@/store/redux/uploadSlice'; // Corrected import path

// Reusable component for collapsing sections
const FormSection = ({ title, children, isExpanded, onToggle, isCollapsible = true }) => (
    <motion.div
        className="bg-card p-4 rounded-lg shadow-sm border border-border mb-4"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
    >
        <div className="flex items-center justify-between cursor-pointer" onClick={isCollapsible ? onToggle : null}>
            <h3 className="text-lg md:text-xl font-semibold text-foreground">{title}</h3>
            {isCollapsible && (
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown size={24} className="text-primary" />
                </motion.div>
            )}
        </div>
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 overflow-hidden"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

// Reusable component for bullet points (descriptions, technologies, etc.)
const BulletPointInput = ({ label, items, onAdd, onChange, onRemove }) => (
    <div className="mt-4">
        <span className="text-sm font-medium block mb-2">{label}</span>
        {items.map((item, index) => (
            <div key={index} className="flex items-center mb-2">
                <textarea
                    className="mt-1 flex-1 rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                    value={item || ''}
                    onChange={(e) => onChange(index, e.target.value)}
                    rows={1}
                />
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="ml-2 text-destructive hover:text-destructive-foreground transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        ))}
        <button
            type="button"
            onClick={onAdd}
            className="flex items-center space-x-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
            <Plus size={16} />
            <span>Add {label}</span>
        </button>
    </div>
);

// Reusable component for social links
const SocialLinksInput = ({ socialLinks, onAdd, onChange, onRemove }) => (
    <div className="mt-4">
        <span className="text-sm font-medium block mb-2">Social Links</span>
        {socialLinks.map((link, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
                <select
                    className="mt-1 block w-1/3 rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                    value={link.platform || ''}
                    onChange={(e) => onChange(index, 'platform', e.target.value)}
                >
                    <option value="">Select Platform</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Personal Website">Personal Website</option>
                </select>
                <input
                    type="url"
                    className="mt-1 block flex-1 rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                    placeholder="URL"
                    value={link.url || ''}
                    onChange={(e) => onChange(index, 'url', e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-destructive hover:text-destructive-foreground transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        ))}
        <button
            type="button"
            onClick={onAdd}
            className="flex items-center space-x-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
            <Plus size={16} />
            <span>Add Social Link</span>
        </button>
    </div>
);

const ResumeForm = ({ resumeData, onInputChange, onArrayChange, addArrayItem, removeArrayItem }) => {
    const dispatch = useDispatch();
    const [expandedSections, setExpandedSections] = useState({
        contact: true,
        summary: true,
        workExperience: true,
        education: true,
        projects: true,
        skills: true,
        certifications: true,
        achievements: true,
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleImageUpload = async (file) => {
        if (!file) {
            toast.error("Please select a file to upload.");
            return;
        }
        const result = await dispatch(uploadSingleFile(file)).unwrap();
        if (result) {
            onInputChange('contact', 'avatar', { url: result.url, publicId: result.publicId });
        }
    };
    
    // A more generic handler to add items to any array
    const handleAddField = (section) => {
        const newItem = {
            workExperience: { jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: [''] },
            education: { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', description: [''] },
            projects: { name: '', url: '', startDate: '', endDate: '', description: [''], technologiesUsed: [''] },
            skills: { category: '', items: [''] },
            certifications: { name: '', issuingOrganization: '', issueDate: '' },
            achievements: { title: '', issuer: '', date: '', description: '', url: '' },
            socialLinks: { platform: '', url: '' },
        }[section];
        addArrayItem(section, newItem);
    };

    return (
        <div className="space-y-6">
            {/* Contact Information Section */}
            <FormSection title="Contact Information" isExpanded={expandedSections.contact} onToggle={() => toggleSection('contact')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-sm font-medium">First Name</span>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.firstName || ''}
                            onChange={(e) => onInputChange('contact', 'firstName', e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">Last Name</span>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.lastName || ''}
                            onChange={(e) => onInputChange('contact', 'lastName', e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">Professional Title</span>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.professionalTitle || ''}
                            onChange={(e) => onInputChange('contact', 'professionalTitle', e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">Email</span>
                        <input
                            type="email"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.email || ''}
                            onChange={(e) => onInputChange('contact', 'email', e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">Phone</span>
                        <input
                            type="tel"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.phone || ''}
                            onChange={(e) => onInputChange('contact', 'phone', e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">Website</span>
                        <input
                            type="url"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.website || ''}
                            onChange={(e) => onInputChange('contact', 'website', e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">City</span>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.address?.city || ''}
                            onChange={(e) => onInputChange('contact', 'address', { ...resumeData.contact.address, city: e.target.value })}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">State</span>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.address?.state || ''}
                            onChange={(e) => onInputChange('contact', 'address', { ...resumeData.contact.address, state: e.target.value })}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">Country</span>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground focus:ring-primary focus:border-primary"
                            value={resumeData.contact.address?.country || ''}
                            onChange={(e) => onInputChange('contact', 'address', { ...resumeData.contact.address, country: e.target.value })}
                        />
                    </label>
                    <label className="block md:col-span-2">
                        <span className="text-sm font-medium">Upload Avatar</span>
                        <div className="flex items-center space-x-2 mt-1">
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e.target.files[0])}
                            />
                            <label htmlFor="avatar-upload" className="flex-1 flex items-center justify-center p-2 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                                <UploadCloud size={24} className="mr-2 text-primary" />
                                <span className="text-sm font-medium text-muted-foreground">Click to upload or drag & drop</span>
                            </label>
                        </div>
                        {resumeData.contact.avatar?.url && (
                            <p className="text-sm text-green-500 mt-2">Avatar uploaded successfully!</p>
                        )}
                    </label>
                    {/* Social Links */}
                    <div className="block md:col-span-2">
                        <SocialLinksInput
                            socialLinks={resumeData.contact.socialLinks || []}
                            onAdd={() => onInputChange('contact', 'socialLinks', [...(resumeData.contact.socialLinks || []), { platform: '', url: '' }])}
                            onChange={(index, field, value) => {
                                const newSocialLinks = [...(resumeData.contact.socialLinks || [])];
                                newSocialLinks[index] = { ...newSocialLinks[index], [field]: value };
                                onInputChange('contact', 'socialLinks', newSocialLinks);
                            }}
                            onRemove={(index) => {
                                const newSocialLinks = (resumeData.contact.socialLinks || []).filter((_, i) => i !== index);
                                onInputChange('contact', 'socialLinks', newSocialLinks);
                            }}
                        />
                    </div>
                </div>
            </FormSection>

            {/* Professional Summary Section */}
            <FormSection title="Professional Summary" isExpanded={expandedSections.summary} onToggle={() => toggleSection('summary')}>
                <label className="block">
                    <span className="text-sm font-medium">Summary</span>
                    <textarea
                        className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 text-foreground h-32 focus:ring-primary focus:border-primary"
                        value={resumeData.summary || ''}
                        onChange={(e) => onInputChange('summary', null, e.target.value)} // 'summary' is a string, so no field name is needed
                    />
                </label>
            </FormSection>

            {/* Work Experience Section */}
            <FormSection title="Work Experience" isExpanded={expandedSections.workExperience} onToggle={() => toggleSection('workExperience')}>
                <AnimatePresence>
                    {resumeData.workExperience.map((job, index) => (
                        <motion.div
                            key={index}
                            className="bg-muted p-4 rounded-lg mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-lg text-foreground">Job #{index + 1}</h4>
                                <button type="button" onClick={() => removeArrayItem('workExperience', index)} className="text-destructive hover:text-destructive-foreground transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm">Job Title</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={job.jobTitle || ''} onChange={(e) => onArrayChange('workExperience', index, 'jobTitle', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Company</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={job.company || ''} onChange={(e) => onArrayChange('workExperience', index, 'company', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Location</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={job.location || ''} onChange={(e) => onArrayChange('workExperience', index, 'location', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Start Date</span>
                                    <input type="date" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={job.startDate || ''} onChange={(e) => onArrayChange('workExperience', index, 'startDate', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">End Date</span>
                                    <input type="date" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={job.endDate || ''} onChange={(e) => onArrayChange('workExperience', index, 'endDate', e.target.value)} />
                                </label>
                            </div>
                            <BulletPointInput
                                label="Description"
                                items={job.description || []}
                                onAdd={() => onArrayChange('workExperience', index, 'description', [...(job.description || []), ''])}
                                onChange={(bulletIndex, value) => {
                                    const newDescriptions = [...job.description];
                                    newDescriptions[bulletIndex] = value;
                                    onArrayChange('workExperience', index, 'description', newDescriptions);
                                }}
                                onRemove={(bulletIndex) => {
                                    const newDescriptions = job.description.filter((_, i) => i !== bulletIndex);
                                    onArrayChange('workExperience', index, 'description', newDescriptions);
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
                <button type="button" onClick={() => handleAddField('workExperience')} className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                    <Plus size={20} />
                    <span>Add Work Experience</span>
                </button>
            </FormSection>

            {/* Education Section */}
            <FormSection title="Education" isExpanded={expandedSections.education} onToggle={() => toggleSection('education')}>
                <AnimatePresence>
                    {resumeData.education.map((edu, index) => (
                        <motion.div key={index} className="bg-muted p-4 rounded-lg mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-lg text-foreground">Education #{index + 1}</h4>
                                <button type="button" onClick={() => removeArrayItem('education', index)} className="text-destructive hover:text-destructive-foreground transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm">Institution</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={edu.institution || ''} onChange={(e) => onArrayChange('education', index, 'institution', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Degree</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={edu.degree || ''} onChange={(e) => onArrayChange('education', index, 'degree', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Field of Study</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={edu.fieldOfStudy || ''} onChange={(e) => onArrayChange('education', index, 'fieldOfStudy', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Location</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={edu.location || ''} onChange={(e) => onArrayChange('education', index, 'location', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Start Date</span>
                                    <input type="date" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={edu.startDate || ''} onChange={(e) => onArrayChange('education', index, 'startDate', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">End Date</span>
                                    <input type="date" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={edu.endDate || ''} onChange={(e) => onArrayChange('education', index, 'endDate', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">GPA</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={edu.gpa || ''} onChange={(e) => onArrayChange('education', index, 'gpa', e.target.value)} />
                                </label>
                            </div>
                            <BulletPointInput
                                label="Description"
                                items={edu.description || []}
                                onAdd={() => onArrayChange('education', index, 'description', [...(edu.description || []), ''])}
                                onChange={(bulletIndex, value) => {
                                    const newDescriptions = [...edu.description];
                                    newDescriptions[bulletIndex] = value;
                                    onArrayChange('education', index, 'description', newDescriptions);
                                }}
                                onRemove={(bulletIndex) => {
                                    const newDescriptions = edu.description.filter((_, i) => i !== bulletIndex);
                                    onArrayChange('education', index, 'description', newDescriptions);
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
                <button type="button" onClick={() => handleAddField('education')} className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                    <Plus size={20} />
                    <span>Add Education</span>
                </button>
            </FormSection>

            {/* Projects Section */}
            <FormSection title="Projects" isExpanded={expandedSections.projects} onToggle={() => toggleSection('projects')}>
                <AnimatePresence>
                    {resumeData.projects.map((project, index) => (
                        <motion.div key={index} className="bg-muted p-4 rounded-lg mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-lg text-foreground">Project #{index + 1}</h4>
                                <button type="button" onClick={() => removeArrayItem('projects', index)} className="text-destructive hover:text-destructive-foreground transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block md:col-span-2">
                                    <span className="text-sm">Project Name</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={project.name || ''} onChange={(e) => onArrayChange('projects', index, 'name', e.target.value)} />
                                </label>
                                <label className="block md:col-span-2">
                                    <span className="text-sm">URL</span>
                                    <input type="url" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={project.url || ''} onChange={(e) => onArrayChange('projects', index, 'url', e.target.value)} />
                                </label>
                            </div>
                            <BulletPointInput
                                label="Technologies Used"
                                items={project.technologiesUsed || []}
                                onAdd={() => onArrayChange('projects', index, 'technologiesUsed', [...(project.technologiesUsed || []), ''])}
                                onChange={(bulletIndex, value) => {
                                    const newTechs = [...project.technologiesUsed];
                                    newTechs[bulletIndex] = value;
                                    onArrayChange('projects', index, 'technologiesUsed', newTechs);
                                }}
                                onRemove={(bulletIndex) => {
                                    const newTechs = project.technologiesUsed.filter((_, i) => i !== bulletIndex);
                                    onArrayChange('projects', index, 'technologiesUsed', newTechs);
                                }}
                            />
                            <BulletPointInput
                                label="Description"
                                items={project.description || []}
                                onAdd={() => onArrayChange('projects', index, 'description', [...(project.description || []), ''])}
                                onChange={(bulletIndex, value) => {
                                    const newDescriptions = [...project.description];
                                    newDescriptions[bulletIndex] = value;
                                    onArrayChange('projects', index, 'description', newDescriptions);
                                }}
                                onRemove={(bulletIndex) => {
                                    const newDescriptions = project.description.filter((_, i) => i !== bulletIndex);
                                    onArrayChange('projects', index, 'description', newDescriptions);
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
                <button type="button" onClick={() => handleAddField('projects')} className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                    <Plus size={20} />
                    <span>Add Project</span>
                </button>
            </FormSection>

            {/* Skills Section */}
            <FormSection title="Skills" isExpanded={expandedSections.skills} onToggle={() => toggleSection('skills')}>
                <AnimatePresence>
                    {resumeData.skills.map((skill, index) => (
                        <motion.div key={index} className="bg-muted p-4 rounded-lg mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-lg text-foreground">Skill Category #{index + 1}</h4>
                                <button type="button" onClick={() => removeArrayItem('skills', index)} className="text-destructive hover:text-destructive-foreground transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <label className="block">
                                <span className="text-sm">Category</span>
                                <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={skill.category || ''} onChange={(e) => onArrayChange('skills', index, 'category', e.target.value)} />
                            </label>
                            <BulletPointInput
                                label="Items (Comma-separated)"
                                items={skill.items || []}
                                onAdd={() => onArrayChange('skills', index, 'items', [...(skill.items || []), ''])}
                                onChange={(bulletIndex, value) => {
                                    const newItems = [...skill.items];
                                    newItems[bulletIndex] = value;
                                    onArrayChange('skills', index, 'items', newItems);
                                }}
                                onRemove={(bulletIndex) => {
                                    const newItems = skill.items.filter((_, i) => i !== bulletIndex);
                                    onArrayChange('skills', index, 'items', newItems);
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
                <button type="button" onClick={() => handleAddField('skills')} className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                    <Plus size={20} />
                    <span>Add Skills Category</span>
                </button>
            </FormSection>
            
            {/* Certifications Section */}
            <FormSection title="Certifications" isExpanded={expandedSections.certifications} onToggle={() => toggleSection('certifications')}>
                <AnimatePresence>
                    {resumeData.certifications.map((cert, index) => (
                        <motion.div key={index} className="bg-muted p-4 rounded-lg mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-lg text-foreground">Certification #{index + 1}</h4>
                                <button type="button" onClick={() => removeArrayItem('certifications', index)} className="text-destructive hover:text-destructive-foreground transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm">Name</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={cert.name || ''} onChange={(e) => onArrayChange('certifications', index, 'name', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Issuing Organization</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={cert.issuingOrganization || ''} onChange={(e) => onArrayChange('certifications', index, 'issuingOrganization', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Issue Date</span>
                                    <input type="date" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={cert.issueDate || ''} onChange={(e) => onArrayChange('certifications', index, 'issueDate', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Expiration Date</span>
                                    <input type="date" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={cert.expirationDate || ''} onChange={(e) => onArrayChange('certifications', index, 'expirationDate', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Credential ID</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={cert.credentialId || ''} onChange={(e) => onArrayChange('certifications', index, 'credentialId', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Credential URL</span>
                                    <input type="url" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={cert.credentialUrl || ''} onChange={(e) => onArrayChange('certifications', index, 'credentialUrl', e.target.value)} />
                                </label>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <button type="button" onClick={() => handleAddField('certifications')} className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                    <Plus size={20} />
                    <span>Add Certification</span>
                </button>
            </FormSection>

            {/* Achievements Section */}
            <FormSection title="Achievements" isExpanded={expandedSections.achievements} onToggle={() => toggleSection('achievements')}>
                <AnimatePresence>
                    {resumeData.achievements.map((achiev, index) => (
                        <motion.div key={index} className="bg-muted p-4 rounded-lg mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-lg text-foreground">Achievement #{index + 1}</h4>
                                <button type="button" onClick={() => removeArrayItem('achievements', index)} className="text-destructive hover:text-destructive-foreground transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm">Title</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={achiev.title || ''} onChange={(e) => onArrayChange('achievements', index, 'title', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Issuer</span>
                                    <input type="text" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={achiev.issuer || ''} onChange={(e) => onArrayChange('achievements', index, 'issuer', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">Date</span>
                                    <input type="date" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={achiev.date || ''} onChange={(e) => onArrayChange('achievements', index, 'date', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="text-sm">URL</span>
                                    <input type="url" className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3" value={achiev.url || ''} onChange={(e) => onArrayChange('achievements', index, 'url', e.target.value)} />
                                </label>
                            </div>
                            <label className="block mt-4">
                                <span className="text-sm">Description</span>
                                <textarea className="mt-1 block w-full rounded-md border-border bg-input py-2 px-3 h-24" value={achiev.description || ''} onChange={(e) => onArrayChange('achievements', index, 'description', e.target.value)} />
                            </label>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <button type="button" onClick={() => handleAddField('achievements')} className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                    <Plus size={20} />
                    <span>Add Achievement</span>
                </button>
            </FormSection>
        </div>
    );
};

export default ResumeForm;