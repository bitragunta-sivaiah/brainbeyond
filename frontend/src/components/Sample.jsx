import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Set up pdfmake with default fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// --- SHARED STYLES & HELPERS ---

const colors = {
  primary: "#2F27CE",
  text: "#050315", // Main text color
  textSecondary: "#4B5563", // For subtitles like company/institution
  textMuted: "#6B7280", // For less important info like dates
  border: "#D1D5DB",
  blue600: "#2563EB",
  sidebarBg: "#F3F4F6", 
};

// 1cm margin (1cm ≈ 28.35 points)
const pageMargins = [28, 28, 28, 28];

const defaultStyle = {
  font: "Roboto",
  fontSize: 10,
  color: colors.text,
  lineHeight: 1.15,
};

const styles = {
  h1: { fontSize: 24, bold: true, alignment: "center", margin: [0, 0, 0, 4] },
  h2: { fontSize: 18, bold: true },
  h3: { fontSize: 14, bold: true },
  professionalTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    alignment: "center",
    margin: [0, 0, 0, 8],
  },
  itemTitle: { fontSize: 11, bold: true, color: colors.text },
  itemSubTitle: { fontSize: 9, color: colors.textSecondary },
  itemDates: { fontSize: 10, color: colors.textMuted },
  descriptionList: { margin: [10, 2, 0, 4], color: colors.textSecondary },
  skillCategory: { bold: true, fontSize: 10, margin: [0, 4, 0, 2] },
  sidebarTitle: {
    fontSize: 12,
    bold: true,
    color: colors.text,
    margin: [0, 8, 0, 4],
  },
};

/**
 * Formats a date range into a "Mon Year - Mon Year" or "Mon Year - Present" string.
 */
const formatDateRange = (item) => {
  const options = { month: 'short', year: 'numeric' };
  
  if (!item?.startDate) return '';

  const startDate = new Date(item.startDate).toLocaleDateString('en-US', options);

  if (item.isCurrent) {
    return `${startDate} - Present`;
  }
  
  if (item.endDate) {
    const endDate = new Date(item.endDate).toLocaleDateString('en-US', options);
    return `${startDate} - ${endDate}`;
  }

  return startDate;
};

/**
 * Generates a bulleted list for descriptions.
 */
const generateDescriptionList = (description) => {
  if (!description || !Array.isArray(description) || description.length === 0) return [];
  const validDescription = description.filter(item => typeof item === 'string');
  if (validDescription.length === 0) return [];
  return [{ ul: validDescription, ...styles.descriptionList }];
};

/**
 * Generates a full-width section header with a bottom border only.
 */
const generateSectionHeader = (title, options = {}) => {
  const { color = colors.blue600 } = options;
  return {
    table: {
      widths: ['*'],
      body: [
        [{ text: title, fontSize: 12, bold: true, color: color, border: [false, false, false, true] }]
      ],
    },
    layout: {
      defaultBorder: false,
      hLineWidth: (i, node) => (i === node.table.body.length) ? 1 : 0, // Only bottom border of the table
      hLineColor: () => colors.border,
      paddingBottom: () => 4,
    },
     margin: [0, 5, 0, 8],
  };
};

// --- TEMPLATE DEFINITIONS ---

const getClassicDefinition = (data) => {
  const { contact, summary, workExperience, education, projects, skills } = data;
  const content = [];

  content.push(
    { text: `${contact?.firstName} ${contact?.lastName}`, style: "h1" },
    { text: contact?.professionalTitle, style: "professionalTitle" },
    {
      columns: [
        { text: `${contact?.address?.city}, ${contact?.address?.state}`, alignment: 'center', width: '*' },
        { text: contact?.phone, alignment: 'center', width: 'auto' },
        { text: contact?.email, alignment: 'center', width: '*' },
      ],
      columnGap: 10,
      fontSize: 9,
      color: colors.textSecondary,
      margin: [0, 0, 0, 5],
    },
    { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 1, lineColor: colors.border }], margin: [0, 0, 0, 10] }
  );

  if (summary) {
    content.push(
      generateSectionHeader('Summary'),
      { text: summary, margin: [0, 0, 0, 10] },
    );
  }
  if (workExperience?.length > 0) {
    content.push(
      generateSectionHeader('Experience'),
      ...workExperience.flatMap((exp) => [
        {
          columns: [
            { text: `${exp?.jobTitle} at ${exp?.company}`, style: "itemTitle" },
            { text: formatDateRange(exp), style: "itemDates", alignment: "right" },
          ],
        },
        ...generateDescriptionList(exp?.description),
      ]),
    );
  }
  if (education?.length > 0) {
    content.push(
      generateSectionHeader('Education'),
      ...education.flatMap((edu) => [
        {
          columns: [
            { text: `${edu?.degree} in ${edu?.fieldOfStudy}`, style: "itemTitle" },
            { text: formatDateRange(edu), style: "itemDates", alignment: "right" },
          ],
        },
        { text: edu?.institution, style: "itemSubTitle" },
        ...generateDescriptionList(edu?.description),
      ]),
    );
  }
  if (projects?.length > 0) {
    content.push(
        generateSectionHeader('Projects'),
        ...projects.flatMap((proj) => [
          {
            columns: [
              { text: proj?.name, style: "itemTitle" },
              { text: formatDateRange(proj), style: "itemDates", alignment: "right" },
            ],
          },
          { text: `Technologies: ${proj?.technologiesUsed?.join(', ')}`, style: 'itemSubTitle', italics: true, margin: [0, 2, 0, 0] },
          ...generateDescriptionList(proj?.description),
        ]),
    );
  }
  if (skills?.length > 0) {
    content.push(
      generateSectionHeader('Skills'),
      {
          columns: skills.map(skill => ({
              stack: [
                  { text: skill?.category, style: 'skillCategory' },
                  { text: skill?.items?.join(' • ') }
              ]
          })),
          columnGap: 20
      },
    );
  }
  
  return { content, styles, defaultStyle, pageMargins };
};

const getMinimalistDefinition = (data) => {
    const { contact, summary, workExperience, education, projects, skills } = data;
    const content = [];
    
    content.push(
        { text: `${contact?.firstName} ${contact?.lastName}`, style: "h1" },
        { text: contact?.professionalTitle, style: "professionalTitle" }
    );

    if (summary) {
        content.push(
            generateSectionHeader('Summary', { color: colors.primary }),
            { text: summary, margin: [0, 0, 0, 10] },
        );
    }
    if (workExperience?.length > 0) {
        content.push(
            generateSectionHeader('Experience', { color: colors.primary }),
            ...workExperience.flatMap(exp => [
                {
                    columns: [
                        { text: `${exp?.jobTitle} at ${exp?.company}`, style: 'itemTitle' },
                        { text: formatDateRange(exp), style: 'itemDates', alignment: 'right' }
                    ],
                    margin: [0, 0, 0, 2]
                },
                ...generateDescriptionList(exp?.description)
            ]),
        );
    }
    if (education?.length > 0) {
        content.push(
            generateSectionHeader('Education', { color: colors.primary }),
            ...education.flatMap(edu => [
                {
                    columns: [
                        { text: `${edu?.degree} in ${edu?.fieldOfStudy}`, style: 'itemTitle' },
                        { text: formatDateRange(edu), style: 'itemDates', alignment: 'right' }
                    ],
                },
                { text: edu?.institution, style: 'itemSubTitle'},
                ...generateDescriptionList(edu?.description)
            ]),
        );
    }
    if (projects?.length > 0) {
        content.push(
            generateSectionHeader('Projects', { color: colors.primary }),
            ...projects.flatMap(proj => [
               {
                   columns: [
                       { text: proj?.name, style: 'itemTitle' },
                       { text: formatDateRange(proj), style: 'itemDates', alignment: 'right' }
                   ],
               },
               { text: `Technologies: ${proj?.technologiesUsed?.join(', ')}`, style: 'itemSubTitle', italics: true, margin: [0, 2, 0, 0] },
               ...generateDescriptionList(proj?.description)
           ]),
        );
    }
    if (skills?.length > 0) {
        content.push(
            generateSectionHeader('Skills', { color: colors.primary }),
            {
                columns: skills.map(skill => ({
                    stack: [
                        { text: skill?.category, style: 'skillCategory' },
                        { text: skill?.items?.join(' • ') }
                    ]
                })),
                columnGap: 20
            },
        );
    }

    return { content, styles, defaultStyle, pageMargins };
};

const getCreativeDefinition = (data) => {
    const { contact, summary, workExperience, education, projects, skills } = data;

    const creativeSectionTitle = (title) => ({
        table: {
            body: [[{ text: title, style: 'sidebarTitle', color: '#FFFFFF', margin: [5, 2, 5, 2] }]]
        },
        layout: { defaultBorder: false, fillColor: colors.primary },
        margin: [0, 5, 0, 5]
    });

    const leftColumnStack = [
        { text: `${contact?.firstName} ${contact?.lastName}`, style: 'h3', color: colors.primary, alignment: 'left' },
        { text: contact?.professionalTitle, style: 'itemSubTitle', alignment: 'left', margin: [0, 0, 0, 10] },
        { text: 'Contact', style: 'sidebarTitle' },
        { text: contact?.phone, margin: [0, 2, 0, 2] },
        { text: contact?.email, margin: [0, 2, 0, 2] },
        { text: `${contact?.address?.city}, ${contact?.address?.state}`, margin: [0, 2, 0, 10] },
    ];
    if (skills?.length > 0) {
        leftColumnStack.push(
            { text: 'Skills', style: 'sidebarTitle' },
            ...skills.map(skill => ({
                stack: [
                    { text: skill?.category, style: 'skillCategory' },
                    { ul: skill?.items }
                ]
            }))
        );
    }

    const rightColumnStack = [];
    if (summary) {
        rightColumnStack.push(
            creativeSectionTitle('Summary'),
            { text: summary, margin: [0, 0, 0, 10] },
        );
    }
    if (workExperience?.length > 0) {
        rightColumnStack.push(
            creativeSectionTitle('Experience'),
            ...workExperience.flatMap(exp => [
                {
                    columns: [
                        { text: `${exp?.jobTitle} at ${exp?.company}`, style: 'itemTitle' },
                        { text: formatDateRange(exp), style: 'itemDates', alignment: 'right' }
                    ], margin: [0, 4, 0, 0]
                },
                ...generateDescriptionList(exp?.description)
            ]),
        );
    }
    if (education?.length > 0) {
        rightColumnStack.push(
            creativeSectionTitle('Education'),
            ...education.flatMap(edu => [
                 {
                    columns: [
                        { text: `${edu?.degree} in ${edu?.fieldOfStudy}`, style: 'itemTitle' },
                        { text: formatDateRange(edu), style: 'itemDates', alignment: 'right' }
                    ], margin: [0, 4, 0, 0]
                 },
                 { text: edu?.institution, style: 'itemSubTitle'},
                 ...generateDescriptionList(edu?.description)
             ]),
        );
    }
     if (projects?.length > 0) {
        rightColumnStack.push(
            creativeSectionTitle('Projects'),
            ...projects.flatMap(proj => [
                {
                    columns: [
                        { text: proj?.name, style: 'itemTitle' },
                        { text: formatDateRange(proj), style: 'itemDates', alignment: 'right' }
                    ], margin: [0, 4, 0, 0]
                },
                { text: `Technologies: ${proj?.technologiesUsed?.join(', ')}`, style: 'itemSubTitle', italics: true },
                ...generateDescriptionList(proj?.description)
            ]),
        );
    }

    const content = [{
        columns: [
            { width: '33%', stack: leftColumnStack, margin: [0, 0, 20, 0] },
            { width: '*', stack: rightColumnStack }
        ]
    }];

    const background = (currentPage, pageSize) => ({
        canvas: [{ type: 'rect', x: 0, y: 0, w: pageSize.width * 0.33, h: pageSize.height, color: colors.sidebarBg }]
    });
    
    return { content, styles, defaultStyle, pageMargins, background };
};

const getModernDefinition = (data) => {
    const { contact, summary, workExperience, education, projects, skills } = data;
    
    const leftColumnStack = [
        { text: `${contact?.firstName} ${contact?.lastName}`, style: 'h2', color: colors.primary, alignment: 'center' },
        { text: contact?.professionalTitle, style: 'itemSubTitle', alignment: 'center', margin: [0, 0, 0, 20] },
        { text: 'CONTACT', style: 'sidebarTitle', alignment: 'left' },
        { text: contact?.phone, margin: [0, 2, 0, 2] },
        { text: contact?.email, margin: [0, 2, 0, 2] },
        { text: `${contact?.address?.city}, ${contact?.address?.state}`, margin: [0, 2, 0, 20] },
    ];
    if (skills?.length > 0) {
        leftColumnStack.push(
            { text: 'SKILLS', style: 'sidebarTitle', alignment: 'left' },
            ...skills.map(skill => ({
                stack: [
                    { text: skill?.category, style: 'skillCategory' },
                    { ul: skill?.items, type: 'circle' }
                ]
            }))
        );
    }

    const rightColumnStack = [];
    if (summary) {
        rightColumnStack.push(
            generateSectionHeader('SUMMARY'),
            { text: summary, margin: [0, 0, 0, 10] },
        );
    }
    if (workExperience?.length > 0) {
        rightColumnStack.push(
            generateSectionHeader('EXPERIENCE'),
            ...workExperience.flatMap(exp => [
                {
                    columns: [
                        { text: exp?.jobTitle, style: 'itemTitle' },
                        { text: formatDateRange(exp), style: 'itemDates', alignment: 'right' }
                    ],
                },
                { text: `${exp?.company} | ${exp?.location}`, style: 'itemSubTitle', margin: [0, 0, 0, 2] },
                ...generateDescriptionList(exp?.description)
            ]),
        );
    }
    if (education?.length > 0) {
        rightColumnStack.push(
            generateSectionHeader('EDUCATION'),
            ...education.flatMap(edu => [
                {
                    columns: [
                        { text: `${edu?.degree} in ${edu?.fieldOfStudy}`, style: 'itemTitle' },
                        { text: formatDateRange(edu), style: 'itemDates', alignment: 'right' }
                    ],
                },
                { text: edu?.institution, style: 'itemSubTitle' },
                ...generateDescriptionList(edu?.description)
            ]),
        );
    }
    if (projects?.length > 0) {
        rightColumnStack.push(
            generateSectionHeader('PROJECTS'),
            ...projects.flatMap(proj => [
                 {
                    columns: [
                        { text: proj?.name, style: 'itemTitle' },
                        { text: formatDateRange(proj), style: 'itemDates', alignment: 'right' }
                    ],
                 },
                 { text: `Technologies: ${proj?.technologiesUsed?.join(', ')}`, style: 'itemSubTitle', italics: true, margin: [0, 2, 0, 0] },
                 ...generateDescriptionList(proj?.description)
            ])
        );
    }

    const content = [{
        columns: [
            { width: '33%', stack: leftColumnStack, margin: [0, 0, 20, 0] },
            { width: '*', stack: rightColumnStack }
        ]
    }];
    
    const background = (currentPage, pageSize) => ({
        canvas: [{ type: 'rect', x: 0, y: 0, w: pageSize.width * 0.33, h: pageSize.height, color: colors.sidebarBg }]
    });

    return { content, styles, defaultStyle, pageMargins, background };
};

export const generatePdf = (templateId, resumeData) => {
  let docDefinition;
  
  const safeData = {
    contact: { address: {}, ...resumeData.contact },
    summary: resumeData.summary || '',
    workExperience: resumeData.workExperience || [],
    education: resumeData.education || [],
    projects: resumeData.projects || [],
    skills: resumeData.skills || [],
  };

  switch (templateId) {
    case "classic":
      docDefinition = getClassicDefinition(safeData);
      break;
    case "modern":
      docDefinition = getModernDefinition(safeData);
      break;
    case "minimalist":
      docDefinition = getMinimalistDefinition(safeData);
      break;
    case "creative":
      docDefinition = getCreativeDefinition(safeData);
      break;
    default:
      docDefinition = getClassicDefinition(safeData);
  }

  return pdfMake.createPdf(docDefinition);
};