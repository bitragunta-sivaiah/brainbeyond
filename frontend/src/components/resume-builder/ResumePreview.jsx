import React, { forwardRef, memo } from "react";
import clsx from "clsx";
import { format } from "date-fns";
import { Globe } from "lucide-react";

// Memoize the component to prevent unnecessary re-renders.
// The component will only re-render if the 'data' or 'template' props change.
const ResumePreview = memo(
  forwardRef(({ data, template, socialIcons }, ref) => {
    const TemplateComponent = template?.component;

    if (!TemplateComponent) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-white">
          <p className="text-center text-lg text-foreground">
            Select a template to view your resume.
          </p>
        </div>
      );
    }

    const formatSocialLinks = (links) => {
      return (links || [])
        .filter((link) => link?.url)
        .map((link) => ({
          ...link,
          icon: socialIcons[link.platform] || <Globe size={16} />,
        }));
    };

    const formatDates = (startDate, endDate, isCurrent) => {
      const start = startDate ? format(new Date(startDate), "MMM yyyy") : "";
      if (isCurrent) {
        return `${start} - Present`;
      }
      const end = endDate ? format(new Date(endDate), "MMM yyyy") : "";
      return end ? `${start} - ${end}` : start;
    };

    const formattedData = {
      ...data,
      contact: {
        ...data.contact,
        socialLinks: formatSocialLinks(data.contact?.socialLinks || []),
      },
      workExperience: (data.workExperience || []).map((exp) => ({
        ...exp,
        dates: formatDates(exp.startDate, exp.endDate, exp.isCurrent),
      })),
      education: (data.education || []).map((edu) => ({
        ...edu,
        dates: formatDates(edu.startDate, edu.endDate, edu.isCurrent),
      })),
      projects: (data.projects || []).map((proj) => ({
        ...proj,
        dates: formatDates(proj.startDate, proj.endDate),
      })),
      certifications: (data.certifications || []).map((cert) => ({
        ...cert,
        issueDate: cert.issueDate ?
          format(new Date(cert.issueDate), "MMM yyyy") :
          "",
        expirationDate: cert.expirationDate ?
          format(new Date(cert.expirationDate), "MMM yyyy") :
          "",
      })),
      achievements: (data.achievements || []).map((ach) => ({
        ...ach,
        date: ach.date ? format(new Date(ach.date), "MMM yyyy") : "",
      })),
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "font-sans text-gray-800 transition-all duration-300",
          template.className
        )}
      >
        <TemplateComponent data={formattedData} />
      </div>
    );
  })
);

ResumePreview.displayName = 'ResumePreview';

export default ResumePreview;