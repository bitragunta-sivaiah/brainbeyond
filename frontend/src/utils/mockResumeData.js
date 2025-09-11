// src/data/mockResumeData.js

export const initialResumeData = {
  fileName: "My Resume",
  contact: {
    firstName: "",
    lastName: "",
    professionalTitle: "",
    email: "",
    phone: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    socialLinks: []
  },
  summary: "",
  workExperience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
  customSections: [],
  sectionOrder: [
    "summary",
    "skills",
    "workExperience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "customSections"
  ],
  isDeleted: false,
};

export const mockResumeData = {
  fileName: "John Doe - Senior Software Engineer",
  contact: {
    firstName: "John",
    lastName: "Doe",
    professionalTitle: "Senior Software Engineer",
    email: "john.doe.dev@example.com",
    phone: "+1-555-123-4567",
    website: "https://johndoe.dev",
    address: {
      street: "123 Innovation Drive",
      city: "Techville",
      state: "California",
      zipCode: "94043",
      country: "USA"
    },
    socialLinks: [
      { platform: "LinkedIn", url: "https://www.linkedin.com/in/johndoe-dev" },
      { platform: "GitHub", url: "https://github.com/johndoe-dev" }
    ]
  },
  summary: "Results-driven Senior Software Engineer with over 8 years of experience in designing, developing, and deploying scalable web applications. Proficient in the MERN stack, with a strong focus on back-end architecture, API design, and cloud infrastructure. Passionate about writing clean, efficient code and mentoring junior developers.",
  workExperience: [
    {
      jobTitle: "Senior Software Engineer",
      company: "Innovatech Solutions Inc.",
      location: "San Francisco, CA",
      startDate: new Date("2021-06-01"),
      isCurrent: true,
      description: [
        "Led the development of a high-traffic e-commerce platform, resulting in a 30% increase in user engagement.",
        "Architected and implemented a new microservices-based back-end using Node.js, Express, and MongoDB, improving system scalability and reducing latency by 40%.",
        "Mentored a team of 4 junior engineers, conducting code reviews and fostering best practices in an Agile environment."
      ]
    },
    {
      jobTitle: "Software Engineer",
      company: "Data Systems Co.",
      location: "Austin, TX",
      startDate: new Date("2017-07-15"),
      endDate: new Date("2021-05-30"),
      isCurrent: false,
      description: [
        "Developed and maintained RESTful APIs for a client-facing analytics dashboard using Node.js and PostgreSQL.",
        "Wrote unit and integration tests using Jest and Supertest, achieving 90% code coverage for critical services."
      ]
    }
  ],
  education: [
    {
      institution: "State University of Technology",
      degree: "Master of Science",
      fieldOfStudy: "Computer Science",
      startDate: new Date("2015-09-01"),
      endDate: new Date("2017-06-15"),
      isCurrent: false,
      gpa: {
        value: "3.9",
        type: "GPA"
      }
    },
    {
      institution: "Global Tech College",
      degree: "Bachelor of Science",
      fieldOfStudy: "Information Technology",
      startDate: new Date("2011-09-01"),
      endDate: new Date("2015-06-15"),
      isCurrent: false,
      gpa: {
        value: "92",
        type: "Percentage"
      }
    }
  ],
  projects: [
    {
      name: "Real-Time Collaborative Code Editor",
      description: [
        "A web-based code editor that allows multiple users to edit and run code snippets in real-time.",
        "Utilized WebSockets for instant communication and CRDTs for conflict-free text synchronization."
      ],
      technologiesUsed: ["React", "Node.js", "Socket.IO", "MongoDB", "Docker"],
      links: [
        { name: "GitHub", url: "https://github.com/johndoe-dev/realtime-editor" },
        { name: "Live Demo", url: "https://editor.johndoe.dev" }
      ]
    },
    {
      name: "AI-Powered Expense Tracker API",
      description: [
        "A RESTful API that parses receipt images using OCR and automatically categorizes expenses.",
        "Built with a serverless architecture on AWS for cost-efficiency and scalability."
      ],
      technologiesUsed: ["Python", "Flask", "AWS Lambda", "Tesseract.js"],
      links: [
        { name: "GitHub", url: "https://github.com/johndoe-dev/expense-tracker-api" }
      ]
    }
  ],
  skills: [
    {
      category: "Programming Languages",
      items: ["JavaScript (ES6+)", "TypeScript", "Python", "SQL"]
    },
    {
      category: "Frameworks & Libraries",
      items: ["Node.js", "Express.js", "React", "Redux", "Mongoose"]
    },
    {
      category: "Databases",
      items: ["MongoDB", "PostgreSQL", "Redis"]
    },
    {
      category: "Cloud & DevOps",
      items: ["AWS (EC2, S3, Lambda)", "Docker", "CI/CD", "Git", "Nginx"]
    }
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect – Associate",
      issuingOrganization: "Amazon Web Services (AWS)",
      issueDate: new Date("2022-08-20"),
      credentialUrl: "https://www.credly.com/your-badge-url"
    }
  ],
  achievements: [
    {
      title: "Innovatech Employee of the Quarter",
      issuer: "Innovatech Solutions Inc.",
      date: new Date("2022-12-31"),
      description: "Recognized for outstanding performance and leadership in the successful launch of the new e-commerce platform."
    }
  ],
  customSections: [
    {
      sectionTitle: "Volunteering",
      items: [
        {
          title: "Technical Mentor",
          subTitle: "Code for Community",
          startDate: new Date("2020-01-01"),
          endDate: new Date("2022-12-31"),
          description: ["Mentored aspiring developers from underrepresented backgrounds, guiding them through full-stack web development projects."],
          links: [{ name: "Organization Website", url: "https://codeforcommunity.org" }]
        }
      ]
    }
  ],
  sectionOrder: [
    "summary",
    "skills",
    "workExperience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "customSections"
  ],
  isDeleted: false,
};