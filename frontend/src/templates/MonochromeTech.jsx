// src/templates/MonochromeTech.jsx

import React from 'react';
import { Mail, Phone, Globe, Linkedin, Github } from 'lucide-react';

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

const socialIcons = {
  linkedin: <Linkedin size={12} className="text-gray-600"/>,
  github: <Github size={12} className="text-gray-600"/>,
  default: <Globe size={12} className="text-gray-600"/>,
};

// This component renders plain text, preserving the monochrome, non-hyperlinked style.
const IconText = ({ icon, text }) => (
  <div className="flex items-center gap-2 mb-2">
    {icon}
    <span className="text-xs text-gray-700">{text}</span>
  </div>
);

const MainSectionHeader = ({ title }) => (
  <h2 className="text-sm font-bold uppercase text-gray-900 tracking-wider mb-2 mt-4 first:mt-0">{title}</h2>
);

const SidebarSectionHeader = ({ title }) => (
  <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider mt-6 mb-2">{title}</h3>
);

const DescriptionList = ({ items }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="list-['■'] list-outside pl-4 text-gray-700 text-justify space-y-1 mt-1">
      {items.map((item, index) => <li key={index} className="pl-2">{item}</li>)}
    </ul>
  );
};

// NEW: A special LinksList for this theme that uses plain text
const LinksList = ({ links }) => {
  if (!Array.isArray(links) || links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
      {links.map(link => (
        <span key={link.name} className="text-xs text-gray-600">
          {link.name}: {link.url}
        </span>
      ))}
    </div>
  );
};


// --- MAIN TEMPLATE COMPONENT ---

export default function MonochromeTech({ data }) {
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
    <div className="flex bg-white text-[9pt] font-sans">
      {/* --- SIDEBAR --- */}
      <aside className="w-[30%] bg-gray-50 p-6">
        <h1 className="text-xl font-bold text-gray-900">{contact.firstName} {contact.lastName}</h1>
        <p className="text-sm text-gray-600 mt-1 mb-6">{contact.professionalTitle}</p>

        <SidebarSectionHeader title="Contact" />
        {contact.email && <IconText icon={<Mail size={12} className="text-gray-600"/>} text={contact.email} />}
        {contact.phone && <IconText icon={<Phone size={12} className="text-gray-600"/>} text={contact.phone} />}
        {contact.website && <IconText icon={<Globe size={12} className="text-gray-600"/>} text={contact.website} />}
        {contact.socialLinks?.map(link => (
          <IconText
            key={link.platform}
            icon={socialIcons[link.platform.toLowerCase()] || socialIcons.default}
            text={link.platform}
          />
        ))}

        {skills.length > 0 && (
          <>
            <SidebarSectionHeader title="Skills" />
            {skills.map(skill => (
              <div key={skill.category} className="mb-2">
                <p className="text-xs font-bold text-gray-800">{skill.category}</p>
                {/* CORRECTED: Now properly handles skills.items which is an array of strings */}
                <p className="text-xs text-gray-600">{Array.isArray(skill.items) ? skill.items.join(', ') : ''}</p>
              </div>
            ))}
          </>
        )}
        
        {education.length > 0 && (
           <>
            <SidebarSectionHeader title="Education" />
            {education.map((edu, index) => (
              <div key={index} className="mb-3">
                 <p className="text-xs font-bold">{edu.degree}{edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}</p>
                 <p className="text-xs italic text-gray-600">{edu.institution}</p>
                 <p className="text-xs text-gray-500">{formatDateRange(edu)}</p>
                 {/* CORRECTED: Added support for structured GPA object */}
                 {edu.gpa?.value && <p className="text-xs text-gray-500 mt-1">{edu.gpa.type}: {edu.gpa.value}</p>}
              </div>
            ))}
          </>
        )}
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="w-[70%] p-6">
        {summary && (
          <section><MainSectionHeader title="Summary" /><p className="text-justify text-gray-700">{summary}</p></section>
        )}
        
        {workExperience.length > 0 && (
          <section>
            <MainSectionHeader title="Experience" />
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
        
        {projects.length > 0 && (
          <section>
            <MainSectionHeader title="Projects" />
            {projects.map((proj, index) => (
              <div key={index} className="mb-3">
                <h3 className="text-[10pt] font-bold">{proj.name}</h3>
                {proj.technologiesUsed?.length > 0 && <p className="text-sm italic text-gray-600">Technologies: {proj.technologiesUsed.join(', ')}</p>}
                {/* CORRECTED: Using the monochrome LinksList helper */}
                <LinksList links={proj.links} />
                <DescriptionList items={proj.description} />
              </div>
            ))}
          </section>
        )}

        {certifications.length > 0 && (
          <section>
            <MainSectionHeader title="Certifications" />
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
            <MainSectionHeader title="Achievements" />
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
            <MainSectionHeader title={section.sectionTitle} />
            {section.items?.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-[10pt] font-bold">{item.title}</h3>
                  <span className="text-gray-500 text-xs">{formatDateRange(item)}</span>
                </div>
                <p className="text-sm italic text-gray-600">{item.subTitle}</p>
                {/* CORRECTED: Using the monochrome LinksList helper */}
                <LinksList links={item.links} />
                <DescriptionList items={item.description} />
              </div>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}