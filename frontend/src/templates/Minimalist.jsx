// src/templates/Minimalist.jsx

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
    <h2 className="text-sm font-bold uppercase text-gray-800 tracking-wider">{title}</h2> {/* Color is gray, not blue */}
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

// NEW: A special LinksList for the Minimalist theme that uses plain text
const LinksList = ({ links }) => {
  if (!Array.isArray(links) || links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
      {links.map(link => (
        // Renders as "Name (URL)" instead of a hyperlink
        <span key={link.name} className="text-xs text-gray-600">
          {link.name}: {link.url}
        </span>
      ))}
    </div>
  );
};


// --- MAIN TEMPLATE COMPONENT ---

export default function Minimalist({ data }) {
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
    <div className="p-6 mx-auto bg-white text-gray-900 text-[9pt] font-sans leading-normal">
      <header className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{contact.firstName} {contact.lastName}</h1>
        <p className="text-sm text-gray-600 mt-1">{contact.professionalTitle}</p>
        <div className="flex justify-center items-center flex-wrap gap-x-2 text-xs text-gray-500 mt-2">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <><span className="text-gray-300">•</span><span>{contact.phone}</span></>}
            {contact.website && <><span className="text-gray-300">•</span><span>{contact.website}</span></>}
            {contact.socialLinks?.map(link => (
              <React.Fragment key={link.platform}>
                <span className="text-gray-300">•</span>
                <span>{link.platform}</span>
              </React.Fragment>
            ))}
        </div>
      </header>

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
              {/* CORRECTED: Using the minimalist LinksList helper */}
              <LinksList links={proj.links} />
              <DescriptionList items={proj.description} />
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <SectionHeader title="Skills" />
          <div className="space-y-1">
            {skills.map((skill, index) => (
              <div key={index} className="flex">
                <p className="w-1/4 font-bold text-gray-800">{skill.category}:</p>
                {/* CORRECTED: Now properly handles skills.items which is an array of strings */}
                <p className="w-3/4 text-gray-700">{Array.isArray(skill.items) ? skill.items.join(' • ') : ''}</p>
              </div>
            ))}
          </div>
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
              {/* CORRECTED: Using the minimalist LinksList helper */}
              <LinksList links={item.links} />
              <DescriptionList items={item.description} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}