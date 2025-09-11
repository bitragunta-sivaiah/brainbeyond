import mongoose from 'mongoose';

const { Schema } = mongoose;

// --- Sub-schema for individual sections on the homepage ---
const homePageSectionSchema = new Schema({
    // Defines the type of content block (e.g., hero banner, featured courses)
    type: {
        type: String,
        enum: [
            'hero',             // Large banner with image/video and CTA
            'featuredCourses',  // Displays a selection of courses
            'testimonials',     // User testimonials or reviews
            'latestBlogPosts',  // Recent blog articles
            'upcomingEvents',   // List of live classes or events
            'cta',              // Standalone Call-to-Action block
            'instructorSpotlight', // Highlights key instructors
            'customHtml'        // For embedding arbitrary HTML content
        ],
        required: [true, 'Section type is required.']
    },
    // Order in which this section appears on the page
    order: {
        type: Number,
        required: [true, 'Section order is required.'],
        min: [0, 'Order cannot be negative.']
    },
    // Controls immediate visibility of the section
    isActive: {
        type: Boolean,
        default: true
    },
    // Optional: Schedule for when the section should be visible
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    // Common stylistic and textual properties for sections
    title: { type: String, trim: true, maxlength: [200, 'Section title cannot exceed 200 characters.'] },
    subtitle: { type: String, trim: true, maxlength: [500, 'Section subtitle cannot exceed 500 characters.'] },
    description: { type: String, trim: true, maxlength: [1000, 'Section description cannot exceed 1000 characters.'] },
    backgroundColor: { type: String, trim: true }, // e.g., "#HEXCODE" or "tailwind-bg-class"
    backgroundImage: { type: String, trim: true }, // URL to background image

    // --- Specific Configuration Objects for Each Section Type ---
    // These objects hold unique properties for each section type.
    // They are optional and only one should be relevant based on 'type'.

    heroConfig: {
        imageUrl: { type: String, trim: true }, // Main image for the hero section
        videoUrl: { type: String, trim: true }, // Optional background video URL
        callToAction: {
            text: { type: String, trim: true, maxlength: 50 },
            link: { type: String, trim: true }, // URL for the CTA button
            buttonStyle: { type: String, trim: true } // Tailwind classes for button styling
        },
        layout: { type: String, enum: ['left-text', 'right-text', 'center-text'], default: 'center-text' }
    },
    featuredCoursesConfig: {
        count: { type: Number, default: 4, min: 1, max: 10 }, // Number of courses to display
        courses: [{
            type: Schema.Types.ObjectId,
            ref: 'Course', // Reference to the Course model
            validate: {
                validator: async function(v) {
                    // Custom validation to ensure referenced courses exist and are published (optional but good practice)
                    if (!v) return true;
                    const CourseModel = mongoose.model('Course');
                    const course = await CourseModel.findById(v);
                    return course && course.isPublished;
                },
                message: 'Referenced course does not exist or is not published.'
            }
        }]
    },
    testimonialsConfig: {
        testimonials: [{
            quote: { type: String, required: [true, 'Testimonial quote is required.'] },
            author: { type: String, required: [true, 'Testimonial author name is required.'] },
            authorTitle: { type: String }, // e.g., "Student", "Web Developer"
            avatar: { type: String }, // URL to author's avatar
            user: { type: Schema.Types.ObjectId, ref: 'User' } // Link to actual User if applicable
        }],
        displayType: { type: String, enum: ['carousel', 'grid'], default: 'carousel' }
    },
    latestBlogPostsConfig: {
        count: { type: Number, default: 3, min: 1, max: 6 }, // Number of latest blog posts to display
        // Content will be fetched automatically by backend based on 'isPublished' and 'createdAt'
    },
    upcomingEventsConfig: {
        count: { type: Number, default: 3, min: 1, max: 6 }, // Number of upcoming events to display
        // Content will be fetched automatically by backend based on 'startTime' and 'status'
        // Assumes existence of an 'Event' or 'LiveClass' model
    },
    ctaConfig: {
        mainText: { type: String,  },
        secondaryText: { type: String, maxlength: 500 },
        buttonText: { type: String, },
        buttonLink: { type: String,   },
        buttonStyle: { type: String }, // Tailwind classes for button styling
        icon: { type: String } // Lucide icon name or SVG for the CTA button
    },
    instructorSpotlightConfig: {
        instructors: [{
            type: Schema.Types.ObjectId,
            ref: 'User', // Reference to User model with 'instructor' role
            validate: {
                validator: async function(v) {
                    if (!v) return true;
                    const UserModel = mongoose.model('User');
                    const user = await UserModel.findById(v);
                    return user && user.role === 'instructor';
                },
                message: 'Referenced user is not a valid instructor.'
            }
        }],
        // Optionally add description or custom title for the spotlight section
    },
    customHtmlConfig: {
        htmlContent: { type: String }, // Raw HTML to be rendered (use with caution for security)
        cssStyles: { type: String },  // Inline CSS for the custom HTML
        jsScripts: { type: String },   // Inline JavaScript for the custom HTML (use with extreme caution)
    }
}, { _id: false }); // Do not create a separate _id for each section subdocument.

// --- Main HomePage Schema ---
const homePageSchema = new Schema({
    // Allows defining multiple homepage configurations (e.g., for A/B testing, seasonal themes)
    name: {
        type: String,
       
        unique: true,
        trim: true,
        default: 'main_default_homepage' // A default name if not provided
    },
    // Flag to indicate if this specific homepage configuration is currently active
    isActive: {
        type: Boolean,
        default: false
    },
    // Flag to indicate if this is the fallback homepage if no other is active
    isDefault: {
        type: Boolean,
        default: false,
        unique: true, // Ensures only one default homepage can exist
        partialFilterExpression: { isDefault: true } // Allows multiple documents with isDefault: false
    },
 
    // Array of sections that compose the homepage, allowing dynamic ordering and content types
    sections: [homePageSectionSchema],

    // Optional: Global styling overrides for the entire homepage
    globalStyles: {
        primaryFont: { type: String, trim: true },
        secondaryFont: { type: String, trim: true },
        baseBackgroundColor: { type: String, trim: true },
        // Add more global styling properties as needed (e.g., textColor, headingColor)
    },
    // Analytics tracking ID (e.g., Google Analytics ID)
    analyticsId: { type: String, trim: true },

}, {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
});

// --- Schema Hooks & Methods ---

// Pre-save hook to ensure only one default homepage is active at any given time.
// If a new homepage is set as default, all others must be unset.
homePageSchema.pre('save', async function(next) {
    if (this.isModified('isDefault') && this.isDefault) {
        // Unset isDefault for all other documents of this model
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isDefault: true },
            { $set: { isDefault: false } }
        );
    }
    next();
});

export default mongoose.model('HomePage', homePageSchema);
