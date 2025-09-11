// src/lib/templates.js

// --- 1. Import Thumbnails ---
// Make sure you have these image assets in the correct path
import thumbnailClassic from "../assets/mockups/classic.jpg";
import thumbnailModern from "../assets/mockups/modern.jpg";
import thumbnailMinimalist from "../assets/mockups/minimalist.jpg";
import thumbnailCreative from "../assets/mockups/creative.jpg";
import thumbnailExecutive from "../assets/mockups/executive.jpg";
import thumbnailMonochrome from "../assets/mockups/monochromeTech.jpg";
import thumbnailVisual from "../assets/mockups/visualImpact.jpg"

// --- 2. Import React Components ---
// These paths should point to where you've saved the template components
import Classic from "@/templates/Classic";
import Modern from "@/templates/Modern";
import Minimalist from "@/templates/Minimalist";
import Creative from "@/templates/Creative";
import Executive from "@/templates/Executive";
import MonochromeTech from "@/templates/MonochromeTech";
import VisualImpact from "@/templates/VisualImpact";

// --- 3. Export Templates Array ---
// This array is used to dynamically render template options in your UI
export const templates = [
  {
    id: "classic",
    name: "Classic",
    component: Classic,
    thumbnail: thumbnailClassic,
    className: "font-sans text-[9pt]", // Example: Matches the font in the component
  },
  {
    id: "modern",
    name: "Modern",
    component: Modern,
    thumbnail: thumbnailModern,
    className: "font-manrope text-[9pt]",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    component: Minimalist,
    thumbnail: thumbnailMinimalist,
    className: "font-sans text-[9pt]",
  },
  {
    id: "creative",
    name: "Creative",
    component: Creative,
    thumbnail: thumbnailCreative,
    className: "font-sans text-[9pt]",
  },
  {
    id: "executive",
    name: "Executive",
    component: Executive,
    thumbnail: thumbnailExecutive,
    className: "font-serif text-[9pt]", // Using a serif font for a formal feel
  },
  {
    id: "monochrome-tech",
    name: "Monochrome Tech",
    component: MonochromeTech,
    thumbnail: thumbnailMonochrome,
    className: "font-sans text-[9pt]",
  },
  {
    id: "visual-impact",
    name: "Visual Impact",
    component: VisualImpact,
    thumbnail: thumbnailVisual,
    className: "font-manrope text-[9pt]",
  },
];