// /utils/helpers.js (Example file)

// Formats a date string (e.g., "2023-08-15") into "Aug 2023"
export const formatDate = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return ''; // Return empty string for invalid dates
  }
};

// Formats a date range for experience, education, etc.
export const formatDateRange = (item) => {
  if (!item?.startDate) return '';
  const startDate = formatDate(item.startDate);
  if (item.isCurrent) return `${startDate} - Present`;
  if (item.endDate) return `${startDate} - ${formatDate(item.endDate)}`;
  return startDate;
};