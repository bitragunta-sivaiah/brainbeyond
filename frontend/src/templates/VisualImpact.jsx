// src/templates/VisualImpact.jsx

import React from 'react';

// --- HELPER FUNCTIONS ---
// It's good practice to keep these in a separate file (e.g., /utils/helpers.js)
const formatDate = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) { return ''; }
};

const formatDateRange = (item) => {
  if (!item?.startDate) return '';
  const startDate = formatDate(item.startDate);
  if (item.isCurrent) return `${startDate} - Present`;
  if (item.endDate) return `${startDate} - ${formatDate(item.endDate)}`;
  return startDate;
};


// --- HELPER COMPONENTS ---

const SectionHeader = ({ title }) => (
  <div className="mb-2 mt-4">
    <h2 className="text-sm font-bold uppercase text-[#1E40AF] tracking-wider">{title}</h2>
    <div className="w-full h-[1px] bg-gray-300 mt-1"></div>
  </div>
);

const DescriptionList = ({ items }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="list-disc list-outside pl-4 text-gray-700 text-justify space-y-1 mt-1">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );
};

// NEW: Helper component to render a list of links
const LinksList = ({ links }) => {
  if (!Array.isArray(links) || links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
      {links.map(link => (
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 hover:underline">
          {link.name || 'Link'}
        </a>
      ))}
    </div>
  );
};

const SkillBar = ({ name, level = 0 }) => {
  const safeLevel = Math.max(0, Math.min(10, level));
  return (
    <div className="flex items-center mb-1">
      <p className="w-[35%] text-sm">{name}</p>
      <div className="w-[65%] h-2 bg-gray-300 rounded-full overflow-hidden">
        <div className="h-2 bg-[#1E40AF] rounded-full" style={{ width: `${safeLevel * 10}%` }}></div>
      </div>
    </div>
  );
};


// --- MAIN TEMPLATE COMPONENT ---

export default function VisualImpact({ data }) {
  // Use default empty objects and arrays to prevent errors if data is missing
  const {
    contact = {},
    summary = '',
    workExperience = [],
    education = [],
    projects = [],
    skills = [],
    certifications = [],
    achievements = [],
    customSections = []
  } = data || {};

  return (
    <div className="bg-white text-gray-900 text-[9pt] font-manrope leading-normal">
      <header className="bg-[#1E40AF] text-white p-6 text-center">
         <h1 className="text-3xl font-bold">{contact.firstName} {contact.lastName}</h1>
        <p className="text-md text-gray-200 mt-1">{contact.professionalTitle}</p>
      </header>
      
      <div className="p-6">
        {summary && (
          <section><SectionHeader title="Summary" /><p className="text-justify text-gray-700">{summary}</p></section>
        )}

        {workExperience.length > 0 && (
          <section>
            <SectionHeader title="Experience" />
            {workExperience.map((exp, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-[10pt] font-bold">{exp.jobTitle} at {exp.company}</h3>
                  <span className="text-gray-500 text-xs">{formatDateRange(exp)}</span>
                </div>
                <p className="text-sm italic text-gray-600">{exp.location}</p>
                <DescriptionList items={exp.description} />
              </div>
            ))}
          </section>
        )}
        
        {skills.length > 0 && (
          <section>
            <SectionHeader title="Skills" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-2">
              {skills.map(category => (
                <div key={category.category}>
                  <h3 className="text-sm font-bold text-[#1E40AF] mb-2">{category.category}</h3>
                  {/* CORRECTED: Smart fallback for skills */}
                  {category.items?.map((item, index) => {
                    // If item is an object with a level, render the bar
                    if (typeof item === 'object' && item !== null && item.value && typeof item.level === 'number') {
                      return <SkillBar key={item.value} name={item.value} level={item.level} />;
                    }
                    // Otherwise, render as plain text (as per schema)
                    if (typeof item === 'string') {
                      return <p key={index} className="text-sm mb-1">{item}</p>;
                    }
                    return null;
                  })}
                </div>
              ))}
            </div>
          </section>
        )}
        
        {education.length > 0 && (
          <section>
            <SectionHeader title="Education" />
            {education.map((edu, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-[10pt] font-bold">{edu.degree}{edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}</h3>
                  <span className="text-gray-500 text-xs">{formatDateRange(edu)}</span>
                </div>
                <p className="text-sm italic text-gray-600">{edu.institution}</p>
                {edu.gpa?.value && <p className="text-xs text-gray-500 mt-1">{edu.gpa.type}: {edu.gpa.value}</p>}
              </div>
            ))}
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <SectionHeader title="Projects" />
            {projects.map((proj, index) => (
              <div key={index} className="mb-3">
                <h3 className="text-[10pt] font-bold">{proj.name}</h3>
                {proj.technologiesUsed?.length > 0 && <p className="text-sm italic text-gray-600">Technologies: {proj.technologiesUsed.join(', ')}</p>}
                {/* CORRECTED: Using LinksList helper for the new links array structure */}
                <LinksList links={proj.links} />
                <DescriptionList items={proj.description} />
              </div>
            ))}
          </section>
        )}

        {certifications.length > 0 && (
          <section>
            <SectionHeader title="Certifications" />
            {certifications.map((cert, index) => (
              <div key={index} className="mb-2">
                 <p className="text-[10pt] font-bold">{cert.name}</p>
                 <p className="text-sm italic text-gray-600">{cert.issuingOrganization} {cert.issueDate && `(${formatDate(cert.issueDate)})`}</p>
              </div>
            ))}
          </section>
        )}
  
        {achievements.length > 0 && (
          <section>
            <SectionHeader title="Achievements" />
             {achievements.map((ach, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-[10pt] font-bold">{ach.title}</h3>
                  <span className="text-gray-500 text-xs">{formatDate(ach.date)}</span>
                </div>
                 <p className="text-sm italic text-gray-600">{ach.issuer}</p>
                 {ach.description && <p className="text-xs mt-1 text-gray-700 text-justify">{ach.description}</p>}
              </div>
            ))}
          </section>
        )}
        
        {customSections.map(section => (
          <section key={section.sectionTitle}>
            <SectionHeader title={section.sectionTitle} />
            {section.items?.map((item, index) => (
               <div key={index} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-[10pt] font-bold">{item.title}</h3>
                  <span className="text-gray-500 text-xs">{formatDateRange(item)}</span>
                </div>
                <p className="text-sm italic text-gray-600">{item.subTitle}</p>
                {/* CORRECTED: Using LinksList helper for the new links array structure */}
                <LinksList links={item.links} />
                <DescriptionList items={item.description} />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}