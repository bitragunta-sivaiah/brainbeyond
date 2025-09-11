import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Set up pdfmake with default fonts
pdfMake.vfs = pdfFonts?.pdfMake?.vfs;

// --- FONT DEFINITIONS ---
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};


// --- SHARED STYLES, COLORS & HELPERS ---

const colors = {
    primary: "#1E40AF",
    text: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#6B7280",
    border: "#D1D5DB",
    sidebarBg: "#F9FAFB",
};

const icons = {
    email: 'M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6M20 6L12 11L4 6H20M20 18H4V8L12 13L20 8V18Z',
    phone: 'M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z',
    linkedin: 'M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 13 11.1V10.2H9V18.5H13V13.7C13 12.9 13.33 12.1 14.31 12.1C15.29 12.1 15.5 12.6 15.5 13.7V18.5H18.5M6.5 11.8V18.5H7.5V11.8H6.5M6.5 8.25A1.75 1.75 0 1 1 8.25 10A1.75 1.75 0 0 1 6.5 8.25Z',
    website: 'M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.78 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93M17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.77 20 8.64 20 12C20 14.08 19.2 15.97 17.9 17.39Z'
};

const pageMargins = [25, 25, 25, 25];

const defaultStyle = {
    font: "Roboto",
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.15,
};

const styles = {
    h1: { fontSize: 22, bold: true, margin: [0, 0, 0, 2] },
    h2: { fontSize: 16, bold: true },
    h3: { fontSize: 12, bold: true, color: colors.primary },
    professionalTitle: { fontSize: 11, color: colors.textSecondary, margin: [0, 0, 0, 6] },
    itemTitle: { fontSize: 10, bold: true },
    itemSubTitle: { fontSize: 9, color: colors.textSecondary, italics: true },
    itemDates: { fontSize: 9, color: colors.textMuted },
    descriptionList: { margin: [10, 2, 0, 4], color: colors.textSecondary, alignment: 'justify' },
    skillCategory: { bold: true, fontSize: 9.5, margin: [0, 4, 0, 2], color: colors.primary },
    sidebarTitle: { fontSize: 12, bold: true, color: colors.text, margin: [0, 6, 0, 3] },
    link: { color: colors.primary, decoration: 'underline' },
    sectionGap: { margin: [0, 0, 0, 8] },
};

// --- HELPER FUNCTIONS ---

const createIconText = (icon, text, link = null) => {
    if (!text) return null;
    return {
        columns: [
            { svg: `<svg width="10" height="10" viewBox="0 0 24 24"><path fill="${colors.textSecondary}" d="${icon}"/></svg>`, width: 10, margin: [0, 1, 0, 0] },
            { text, link, style: 'link', color: colors.textSecondary, width: '*' }
        ],
        columnGap: 4,
        margin: [0, 0, 0, 3]
    };
};

const formatDate = (date) => {
    if (!date) return '';
    try {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) {
        return ''; // Return empty string for invalid dates
    }
};

const formatDateRange = (item) => {
    if (!item?.startDate) return '';
    const startDate = formatDate(item.startDate);
    if (item.isCurrent) return `${startDate} - Present`;
    if (item.endDate) return `${startDate} - ${formatDate(item.endDate)}`;
    return startDate;
};

const generateDescriptionList = (description) => {
    const descriptions = description || [];
    if (!descriptions.length || !descriptions.some(item => item)) return [];
    return [{ ul: descriptions.filter(item => item), ...styles.descriptionList, type: 'square' }];
};

const generateLinks = (links) => {
    const linkList = links || [];
    if (!linkList.length) return [];
    const linkItems = linkList.filter(l => l && l.url).map(link => ({
        text: link.name || 'Link',
        link: link.url,
        style: 'link',
        width: 'auto'
    }));
    if (linkItems.length === 0) return [];
    return [{ columns: linkItems, columnGap: 10, margin: [0, 1, 0, 3] }];
};

const generateSectionHeader = (title) => ({
    stack: [
        { text: (title || 'Section').toUpperCase(), fontSize: 12, bold: true, color: colors.primary },
        { canvas: [{ type: 'line', x1: 0, y1: 1, x2: 545, y2: 1, lineWidth: 0.5, lineColor: colors.border }] }
    ],
    margin: [0, 10, 0, 4],
    unbreakable: true
});

const mapSkillItems = (items) => {
    const skillItems = items || [];
    if (!skillItems.length) return [];
    return skillItems.map(item => (typeof item === 'object' ? item.value || '' : item)).filter(Boolean);
};

const buildStandardSections = (contentArray, sectionsConfig, data) => {
    const { customSections } = data;

    sectionsConfig.forEach(section => {
        if (section && section.data && Array.isArray(section.data) && section.data.length > 0) {
            contentArray.push(generateSectionHeader(section.title));
            if (section.isSkills) {
                const skillRows = section.data.map(skill => ({
                    columns: [
                        { text: (skill?.category || 'Skills') + ':', bold: true, width: '25%', color: colors.text },
                        { text: mapSkillItems(skill?.items).join(' • '), width: '*' }
                    ],
                    columnGap: 10,
                    margin: [0, 2, 0, 2]
                }));
                contentArray.push({ stack: skillRows, margin: [0, 4, 0, 4] });
            } else if (section.renderer) {
                contentArray.push(...section.data.flatMap(item => [{ stack: section.renderer(item || {}), ...styles.sectionGap }]));
            } else {
                contentArray.push(...section.data);
            }
        }
    });

    (customSections || []).forEach(section => {
        if (section && section.sectionTitle && section.items?.length > 0) {
            contentArray.push(generateSectionHeader(section.sectionTitle));
            contentArray.push(...section.items.flatMap(item => {
                const currentItem = item || {};
                return [{
                    stack: [
                        { columns: [{ text: currentItem.title || '', style: "itemTitle" }, { text: formatDateRange(currentItem), style: "itemDates", alignment: "right" }] },
                        { text: currentItem.subTitle || '', style: 'itemSubTitle' },
                        ...generateLinks(currentItem.links),
                        ...generateDescriptionList(currentItem.description)
                    ], ...styles.sectionGap
                }];
            }));
        }
    });
};

// --- TEMPLATE DEFINITIONS ---

// Helper function for Certification Renderer to avoid repetition
const renderCertification = (cert = {}) => {
    const dateText = formatDate(cert.issueDate);
    // **CORRECTION**: Conditionally build the subtitle string to avoid empty parentheses.
    const subtitleParts = [cert.issuingOrganization, dateText ? `(${dateText})` : null].filter(Boolean);
    
    return [
        { text: cert.name || '', style: 'itemTitle' },
        { text: subtitleParts.join(' '), style: 'itemSubTitle' },
        ...(cert.credentialUrl ? [{ text: `Credential URL: ${cert.credentialUrl}`, color: colors.textMuted, fontSize: 8.5, margin: [0, 2, 0, 0] }] : [])
    ];
};

const getClassicDefinition = (data) => {
    const { contact, summary, workExperience, education, projects, skills, certifications, achievements } = data;

    const contactParts = [
        contact.email ? { text: contact.email, link: `mailto:${contact.email}`, style: 'link' } : null,
        contact.phone,
        contact.website ? { text: 'Website', link: contact.website, style: 'link' } : null,
        ...(contact.socialLinks || []).filter(sl => sl && sl.url).map(sl => ({ text: sl.platform, link: sl.url, style: 'link' }))
    ].filter(Boolean);

    const finalContactText = [];
    contactParts.forEach((part, index) => {
        finalContactText.push(typeof part === 'string' ? { text: part } : part);
        if (index < contactParts.length - 1) {
            finalContactText.push({ text: ' • ', color: colors.textMuted });
        }
    });

    const content = [
        { text: `${contact?.firstName || ''} ${contact?.lastName || ''}`, style: "h1", alignment: "center" },
        { text: contact?.professionalTitle || '', style: "professionalTitle", alignment: "center" },
        { text: finalContactText, alignment: 'center', fontSize: 9, color: colors.textSecondary, margin: [0, 0, 0, 8] },
    ];

    const sectionsConfig = [
        { title: 'Summary', data: summary ? [{ text: summary, alignment: 'justify' }] : [] },
        { title: 'Experience', data: workExperience, renderer: (exp = {}) => [{ columns: [{ text: `${exp.jobTitle || ''} at ${exp.company || ''}`, style: "itemTitle" }, { text: formatDateRange(exp), style: "itemDates", alignment: "right" }] }, { text: exp.location || '', style: 'itemSubTitle' }, ...generateDescriptionList(exp.description)] },
        { title: 'Education', data: education, renderer: (edu = {}) => [{ columns: [{ text: `${edu.degree || ''}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`, style: "itemTitle" }, { text: formatDateRange(edu), style: "itemDates", alignment: "right" }] }, { text: edu.institution || '', style: "itemSubTitle" }, ...(edu.gpa?.value ? [{ text: `${edu.gpa.type}: ${edu.gpa.value}`, fontSize: 9, color: colors.textMuted, margin: [0, 1, 0, 0] }] : [])] },
        { title: 'Projects', data: projects, renderer: (proj = {}) => [{ text: proj.name || '', style: "itemTitle" }, ...((proj.technologiesUsed || []).length ? [{ text: `Technologies: ${(proj.technologiesUsed || []).join(', ')}`, style: 'itemSubTitle', margin: [0, 1, 0, 1] }] : []), ...generateLinks(proj.links), ...generateDescriptionList(proj.description)] },
        { title: 'Skills', data: skills, isSkills: true },
        { title: 'Certifications', data: certifications, renderer: renderCertification },
        { title: 'Achievements', data: achievements, renderer: (ach = {}) => [{ columns: [{ text: ach.title || '', style: 'itemTitle' }, { text: formatDate(ach.date), style: 'itemDates', alignment: 'right' }] }, { text: ach.issuer || '', style: 'itemSubTitle' }, ...(ach.description ? [{ text: ach.description, margin: [0, 2, 0, 0], alignment: 'justify' }] : [])] },
    ];

    buildStandardSections(content, sectionsConfig, data);
    return { content, styles, defaultStyle, pageMargins };
};

const getMinimalistDefinition = (data) => {
    const classicDef = getClassicDefinition(data);
    classicDef.content.forEach(item => {
        if (item.stack && item.stack[0]?.color) {
            item.stack[0].color = colors.text;
        }
    });
    if (classicDef.styles.h1) {
        classicDef.styles.h1.color = colors.text;
    }
    return classicDef;
};

const getCreativeDefinition = (data) => {
    const { contact, summary, workExperience, education, projects, skills, certifications, achievements, customSections } = data;

    const sidebarSectionTitle = (title) => ({ text: (title || '').toUpperCase(), style: 'sidebarTitle', margin: [0, 8, 0, 2] });
    const mainSectionTitle = (title) => ({ text: (title || '').toUpperCase(), style: 'h3', margin: [0, 0, 0, 4] });

    const socialLinks = (contact.socialLinks || []).filter(sl => sl && sl.url).map(sl => {
        const icon = (sl.platform || '').toLowerCase() === 'linkedin' ? icons.linkedin : icons.website;
        return createIconText(icon, sl.platform, sl.url);
    });

    const leftColumnStack = [
        { text: `${contact?.firstName || ''} ${contact?.lastName || ''}`, style: 'h2', color: colors.primary, alignment: 'left' },
        { text: contact?.professionalTitle || '', style: 'itemSubTitle', alignment: 'left', margin: [0, 0, 0, 10] },
        sidebarSectionTitle('Contact'),
        createIconText(icons.email, contact.email, `mailto:${contact.email}`),
        createIconText(icons.phone, contact.phone),
        createIconText(icons.website, contact.website, contact.website),
        ...socialLinks,
    ];

    if (skills?.length > 0) {
        leftColumnStack.push(sidebarSectionTitle('Skills'));
        skills.forEach(skill => {
            leftColumnStack.push(
                { text: skill?.category || '', style: 'skillCategory' },
                { text: mapSkillItems(skill?.items).join(', '), fontSize: 8.5, margin: [0, 0, 0, 4] }
            );
        });
    }

    if (education?.length > 0) {
        leftColumnStack.push(sidebarSectionTitle('Education'));
        education.forEach(edu => {
            leftColumnStack.push(
                { text: `${edu?.degree || ''}${edu?.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}`, bold: true, fontSize: 10 },
                { text: edu?.institution || '', style: 'itemSubTitle' },
                { text: formatDateRange(edu), style: 'itemDates', margin: [0, 2, 0, 8] }
            );
        });
    }

    const rightColumnStack = [];
    if (summary) {
        rightColumnStack.push(mainSectionTitle('Summary'), { text: summary, alignment: 'justify', margin: [0, 0, 0, 10] });
    }

    const sections = [
        { title: 'Experience', data: workExperience, renderer: (exp = {}) => [{ columns: [{ text: `${exp.jobTitle || ''} at ${exp.company || ''}`, style: 'itemTitle' }, { text: formatDateRange(exp), style: 'itemDates', alignment: 'right' }] }, { text: exp.location || '', style: 'itemSubTitle' }, ...generateDescriptionList(exp.description)] },
        { title: 'Projects', data: projects, renderer: (proj = {}) => [{ text: proj.name || '', style: 'itemTitle' }, ...((proj.technologiesUsed || []).length ? [{ text: `Technologies: ${(proj.technologiesUsed || []).join(', ')}`, style: 'itemSubTitle', margin: [0, 1, 0, 1] }] : []), ...generateLinks(proj.links), ...generateDescriptionList(proj.description)] },
        { title: 'Certifications', data: certifications, renderer: renderCertification },
        { title: 'Achievements', data: achievements, renderer: (ach = {}) => [{ columns: [{ text: ach.title || '', style: 'itemTitle' }, { text: formatDate(ach.date), style: 'itemDates', alignment: 'right' }] }, { text: ach.issuer || '', style: 'itemSubTitle' }, ...(ach.description ? [{ text: ach.description, margin: [0, 2, 0, 0], alignment: 'justify' }] : [])] },
    ];

    sections.forEach(section => {
        if (section.data?.length > 0) {
            rightColumnStack.push(mainSectionTitle(section.title));
            rightColumnStack.push(...section.data.flatMap(item => [{ stack: section.renderer(item || {}), ...styles.sectionGap }]));
        }
    });

    (customSections || []).forEach(section => {
        if (section.sectionTitle && section.items?.length > 0) {
            rightColumnStack.push(mainSectionTitle(section.sectionTitle));
            rightColumnStack.push(...section.items.flatMap(item => {
                const currentItem = item || {};
                return [{ stack: [{ columns: [{ text: currentItem.title, style: "itemTitle" }, { text: formatDateRange(currentItem), style: "itemDates", alignment: "right" }] }, { text: currentItem.subTitle, style: 'itemSubTitle' }, ...generateLinks(currentItem.links), ...generateDescriptionList(currentItem.description)], ...styles.sectionGap }];
            }));
        }
    });

    const content = [{ columns: [{ width: '30%', stack: leftColumnStack }, { width: '*', stack: rightColumnStack }], columnGap: 15 }];
    const background = () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28 * 0.3, h: 841.89, color: colors.sidebarBg }] });
    return { content, styles, defaultStyle, pageMargins, background };
};

const getModernDefinition = (data) => {
    const { contact, summary, workExperience, education, projects, skills, certifications, achievements } = data;

    const contactDetails = [
        contact.email ? { text: contact.email, link: `mailto:${contact.email}`, style: 'link' } : null,
        contact.phone,
        contact.website ? { text: 'Website', link: contact.website, style: 'link' } : null,
        ...(contact.socialLinks || []).filter(sl => sl && sl.url).map(sl => ({ text: sl.platform, link: sl.url, style: 'link' }))
    ].filter(Boolean).map(item => (typeof item === 'string' ? { text: item } : item));

    const content = [{
        columns: [
            { stack: [{ text: `${contact?.firstName || ''} ${contact?.lastName || ''}`, style: 'h2' }, { text: contact?.professionalTitle || '', style: 'professionalTitle' }] },
            { stack: contactDetails, alignment: 'right', fontSize: 9 }
        ],
        marginBottom: 10
    }];

    const sectionsConfig = [
        { title: 'Summary', data: summary ? [{ text: summary, alignment: 'justify' }] : [] },
        { title: 'Experience', data: workExperience, renderer: (exp = {}) => [{ columns: [{ text: exp.jobTitle || '', style: "itemTitle" }, { text: formatDateRange(exp), style: "itemDates", alignment: "right" }] }, { text: `${exp.company || ''} | ${exp.location || ''}`, style: 'itemSubTitle' }, ...generateDescriptionList(exp.description)] },
        { title: 'Projects', data: projects, renderer: (proj = {}) => [{ text: proj.name || '', style: "itemTitle" }, ...((proj.technologiesUsed || []).length ? [{ text: `Technologies: ${(proj.technologiesUsed || []).join(', ')}`, style: 'itemSubTitle', margin: [0, 1, 0, 1] }] : []), ...generateLinks(proj.links), ...generateDescriptionList(proj.description)] },
        { title: 'Education', data: education, renderer: (edu = {}) => [{ columns: [{ text: `${edu.degree || ''}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}`: ''}`, style: "itemTitle" }, { text: formatDateRange(edu), style: "itemDates", alignment: "right" }] }, { text: edu.institution || '', style: "itemSubTitle" }, ...(edu.gpa?.value ? [{ text: `${edu.gpa.type}: ${edu.gpa.value}`, fontSize: 9, color: colors.textMuted, margin: [0, 1, 0, 0] }] : [])] },
        { title: 'Skills', data: skills, isSkills: true },
        { title: 'Certifications', data: certifications, renderer: renderCertification },
        { title: 'Achievements', data: achievements, renderer: (ach = {}) => [{ columns: [{ text: ach.title || '', style: 'itemTitle' }, { text: formatDate(ach.date), style: 'itemDates', alignment: 'right' }] }, { text: ach.issuer || '', style: 'itemSubTitle' }, ...(ach.description ? [{ text: ach.description, margin: [0, 2, 0, 0], alignment: 'justify' }] : [])] },
    ];

    buildStandardSections(content, sectionsConfig, data);
    return { content, styles, defaultStyle, pageMargins };
};

const getExecutiveDefinition = (data) => {
    const modernDef = getModernDefinition(data);
    const header = modernDef.content[0];
    if (header && header.columns && header.columns[0].stack) {
        header.columns[0].stack[0] = { text: `${data.contact?.firstName || ''} ${data.contact?.lastName || ''}`.toUpperCase(), style: 'h1', color: colors.primary };
        header.marginBottom = 5;
    }
    modernDef.content.splice(1, 0, { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 545, y2: 5, lineWidth: 1.5, lineColor: colors.primary }], margin: [0, 0, 0, 10] });
    return { ...modernDef, defaultStyle: { ...defaultStyle, lineHeight: 1.2 } };
};

const getMonochromeTechDefinition = (data) => {
    const creativeDef = getCreativeDefinition(data);
    const monoColors = { primary: "#111827", sidebarBg: "#F9FAFB" };
    const newContent = JSON.parse(JSON.stringify(creativeDef.content));
    const replaceColor = (obj) => {
        for (let key in obj) {
            if (key === 'color' && obj[key] === colors.primary) {
                obj[key] = monoColors.primary;
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                replaceColor(obj[key]);
            }
        }
    };
    replaceColor(newContent);
    const newStyles = { ...styles, h3: { ...styles.h3, color: monoColors.primary }, link: { ...styles.link, color: monoColors.primary } };
    const background = () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28 * 0.3, h: 841.89, color: monoColors.sidebarBg }] });
    return { ...creativeDef, content: newContent, styles: newStyles, background };
};

const getVisualImpactDefinition = (data) => {
    const { contact, skills } = data;

    const header = {
        table: {
            widths: ['*'],
            body: [[{
                stack: [
                    { text: `${contact?.firstName || ''} ${contact?.lastName || ''}`, style: 'h1', color: '#FFFFFF', bold: true, alignment: 'center' },
                    { text: contact?.professionalTitle || '', style: 'professionalTitle', color: '#E5E7EB', alignment: 'center' }
                ],
                border: [false, false, false, false],
                padding: [0, 10, 0, 10]
            }]]
        },
        layout: { defaultBorder: false, fillColor: colors.primary },
        marginBottom: 8
    };

    const createSkillBar = (skillName, level = 0) => {
        const filledWidth = Math.max(0, Math.min(10, level)) * 10;
        return {
            columns: [
                { text: skillName || '', width: '35%', fontSize: 9 },
                {
                    table: {
                        widths: [`${filledWidth}%`, `${100 - filledWidth}%`],
                        body: [[
                            { border: [false, false, false, false], fillColor: colors.primary, text: '', margin: [0, 2, 0, 2] },
                            { border: [false, false, false, false], fillColor: colors.border, text: '', margin: [0, 2, 0, 2] }
                        ]]
                    },
                    layout: 'noBorders', margin: [0, 3, 0, 0]
                }
            ],
            marginBottom: 3,
        };
    };

    const baseDataWithoutSkills = { ...data, skills: [] };
    const baseDef = getClassicDefinition(baseDataWithoutSkills);

    let content = [header, ...baseDef.content.slice(3)];

    if (skills && skills.length > 0) {
        content.push(generateSectionHeader('Skills'));
        const hasLevels = skills[0]?.items[0]?.level !== undefined;

        if (hasLevels) {
            const skillContent = skills.map(category => ({
                stack: [
                    { text: category?.category || '', style: 'skillCategory' },
                    ...(category?.items || []).map(item => createSkillBar(item?.value, item?.level))
                ],
                width: '*'
            }));
            content.push({ columns: skillContent, columnGap: 20, margin: [0, 4, 0, 8] });
        } else {
            const skillRows = skills.map(skill => ({
                columns: [
                    { text: (skill?.category || '') + ':', bold: true, width: '25%', color: colors.text },
                    { text: mapSkillItems(skill?.items).join(' • '), width: '*' }
                ],
                columnGap: 10,
                margin: [0, 2, 0, 2]
            }));
            content.push({ stack: skillRows, margin: [0, 4, 0, 4] });
        }
    }

    return { ...baseDef, content };
};

// --- MAIN PDF GENERATOR FUNCTION ---
export const generatePdf = (templateId, resumeData) => {
    let docDefinition;

    const safeData = {
        contact: { address: {}, socialLinks: [], ...(resumeData?.contact || {}) },
        summary: resumeData?.summary || '',
        workExperience: resumeData?.workExperience || [],
        education: resumeData?.education || [],
        projects: resumeData?.projects || [],
        skills: resumeData?.skills || [],
        certifications: resumeData?.certifications || [],
        achievements: resumeData?.achievements || [],
        customSections: resumeData?.customSections || [],
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
        case "executive":
            docDefinition = getExecutiveDefinition(safeData);
            break;
        case "monochrome-tech":
            docDefinition = getMonochromeTechDefinition(safeData);
            break;
        case "visual-impact":
            docDefinition = getVisualImpactDefinition(safeData);
            break;
        default:
            docDefinition = getModernDefinition(safeData);
    }

    return pdfMake.createPdf(docDefinition);
};