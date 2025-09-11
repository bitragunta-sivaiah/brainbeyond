import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';

// Import Redux Thunk
import { getCertificateById } from '../store/redux/courseCertificatesSlice'; // Adjust the import path

// Import Icons and other components
import {
    Award,
    Download,
    Share2,
    X,
    LoaderCircle,
    AlertTriangle,
    CheckCircle,
    Sparkles,
    DollarSign,
    Calendar,
    Zap,
    Crown,
    Briefcase,
    BookOpen,
    GraduationCap,
} from 'lucide-react';

// --- SVG Logo Components (Defined globally for reuse) ---

const EmblemOfIndia = ({ className }) => (
    <svg className={className} viewBox="0 0 87 121" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M43.5 0L48.5 15.5H38.5L43.5 0Z" fill="#D4AF37" />
        <path d="M60.5 16.5C60.5 24.5 53 30.5 43.5 30.5C34 30.5 26.5 24.5 26.5 16.5H60.5Z" fill="#D4AF37" />
        <path d="M68 31.5H19C19 45 28 54.5 43.5 54.5C59 54.5 68 45 68 31.5Z" fill="#D4AF37" />
        <rect x="15" y="55" width="57" height="8" fill="#D4AF37" />
        <path d="M43.5 63L53.5 78H33.5L43.5 63Z" fill="#D4AF37" />
        <path d="M22 78H65L72 100H15L22 78Z" fill="#D4AF37" />
        <path d="M10 100H77L86.5 120.5H0.5L10 100Z" fill="#D4AF37" />
    </svg>
);

const AshokaChakra = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#000080" strokeWidth="4" />
        <circle cx="50" cy="50" r="8" fill="#000080" />
        {Array.from({ length: 24 }).map((_, i) => (
            <line key={i} x1="50" y1="50" x2="50" y2="5" stroke="#000080" strokeWidth="2" transform={`rotate(${i * 15}, 50, 50)`} />
        ))}
    </svg>
);

const DigitalIndiaLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <path d="M100 20L120 80H80L100 20Z" fill="#007ACC"/>
        <circle cx="100" cy="100" r="60" stroke="#007ACC" strokeWidth="10"/>
        <path d="M100 140L140 160H60L100 140Z" fill="#007ACC"/>
        <text x="100" y="110" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#007ACC">DI</text>
    </svg>
);

const SkillIndiaLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <path d="M100 20L120 80H80L100 20Z" fill="#FF8C00"/>
        <circle cx="100" cy="100" r="60" stroke="#FF8C00" strokeWidth="10"/>
        <path d="M100 140L140 160H60L100 140Z" fill="#FF8C00"/>
        <text x="100" y="110" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#FF8C00">SI</text>
    </svg>
);

const NCVETLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <path d="M100 20L120 80H80L100 20Z" fill="#008000"/>
        <circle cx="100" cy="100" r="60" stroke="#008000" strokeWidth="10"/>
        <path d="M100 140L140 160H60L100 140Z" fill="#008000"/>
        <text x="100" y="110" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#008000">N</text>
    </svg>
);

const MinistryOfEducationLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <path d="M100 20L120 80H80L100 20Z" fill="#8B0000"/>
        <circle cx="100" cy="100" r="60" stroke="#8B0000" strokeWidth="10"/>
        <path d="M100 140L140 160H60L100 140Z" fill="#8B0000"/>
        <text x="100" y="110" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#8B0000">MoE</text>
    </svg>
);

const NSDCLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <path d="M100 20L120 80H80L100 20Z" fill="#006400"/>
        <circle cx="100" cy="100" r="60" stroke="#006400" strokeWidth="10"/>
        <path d="M100 140L140 160H60L100 140Z" fill="#006400"/>
        <text x="100" y="110" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#006400">NSDC</text>
    </svg>
);

const HDSPlatformLogo = ({ className, color }) => (
    <div className={className} style={{ color: color }}>
        <Award className="h-full w-full" />
    </div>
);

// --- Helper Components ---
const Loader = () => (
    <div className="flex justify-center items-center h-full w-full p-8 min-h-[50vh]">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
            <LoaderCircle className="h-12 w-12 text-blue-600" />
        </motion.div>
    </div>
);

const ErrorMessage = ({ error }) => (
    <div className="flex flex-col items-center justify-center bg-red-50 text-red-700 p-6 rounded-lg border border-dashed border-red-300">
        <AlertTriangle className="h-10 w-10 mb-3" />
        <h3 className="font-bold text-xl">Oops! Something went wrong.</h3>
        <p className="text-center mt-1">{error}</p>
    </div>
);

// --- Helper for Certificate Design Properties ---
const getCertificateDesignProps = (designType) => {
    let classes = {
        outerBorder: 'border-amber-800',
        innerBorder: 'border-amber-900',
        mainTitle: 'text-amber-900',
        studentName: 'text-blue-900',
        platformName: 'text-slate-800',
        accentColor: 'text-amber-900',
        backgroundColor: 'bg-[#fdfbf5]',
        badge: null,
        badgeIcon: null,
        badgeText: '',
        headerLogoLeft: null,
        headerLogoCenter: null,
        headerLogoRight: null,
        footerLogoLeft: null,
        footerLogoRight: null,
    };

    // Default logos for all certificates
    classes.headerLogoLeft = <HDSPlatformLogo className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />;
    classes.headerLogoRight = <EmblemOfIndia className="w-10 h-14 sm:w-16 sm:h-20" />;
    classes.footerLogoLeft = <AshokaChakra className="w-10 h-10 sm:w-12 sm:h-12 text-blue-800 opacity-80" />;
    classes.footerLogoRight = <DigitalIndiaLogo className="w-10 h-10 sm:w-12 sm:h-12" />;

    switch (designType) {
        case 'Free Course':
            classes.outerBorder = 'border-gray-400';
            classes.innerBorder = 'border-gray-500';
            classes.mainTitle = 'text-gray-700';
            classes.studentName = 'text-gray-800';
            classes.accentColor = 'text-gray-600';
            classes.backgroundColor = 'bg-gray-50';
            classes.badge = 'bg-gray-200 text-gray-700';
            classes.badgeIcon = <Sparkles className="h-4 w-4" />;
            classes.badgeText = 'Free Access';
            classes.headerLogoLeft = <HDSPlatformLogo className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600" />;
            classes.footerLogoRight = <SkillIndiaLogo className="w-10 h-10 sm:w-12 sm:h-12" />;
            break;
        case 'Purchased Course':
            classes.outerBorder = 'border-green-600';
            classes.innerBorder = 'border-green-700';
            classes.mainTitle = 'text-green-800';
            classes.studentName = 'text-green-900';
            classes.accentColor = 'text-green-700';
            classes.backgroundColor = 'bg-green-50';
            classes.badge = 'bg-green-500 text-white';
            classes.badgeIcon = <DollarSign className="h-4 w-4" />;
            classes.badgeText = 'Direct Purchase';
            classes.headerLogoLeft = <HDSPlatformLogo className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />;
            classes.footerLogoRight = <NCVETLogo className="w-10 h-10 sm:w-12 sm:h-12" />;
            break;
        case 'Basic Monthly Subscription':
            classes.outerBorder = 'border-blue-400';
            classes.innerBorder = 'border-blue-500';
            classes.mainTitle = 'text-blue-700';
            classes.studentName = 'text-blue-800';
            classes.accentColor = 'text-blue-600';
            classes.backgroundColor = 'bg-blue-50';
            classes.badge = 'bg-blue-400 text-white';
            classes.badgeIcon = <Calendar className="h-4 w-4" />;
            classes.badgeText = 'Basic Monthly';
            classes.headerLogoLeft = <HDSPlatformLogo className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />;
            classes.footerLogoRight = <DigitalIndiaLogo className="w-10 h-10 sm:w-12 sm:h-12" />;
            break;
        case 'Standard Yearly Subscription':
            classes.outerBorder = 'border-purple-600';
            classes.innerBorder = 'border-purple-700';
            classes.mainTitle = 'text-purple-800';
            classes.studentName = 'text-purple-900';
            classes.accentColor = 'text-purple-700';
            classes.backgroundColor = 'bg-purple-50';
            classes.badge = 'bg-purple-600 text-white';
            classes.badgeIcon = <Zap className="h-4 w-4" />;
            classes.badgeText = 'Standard Yearly';
            classes.headerLogoLeft = <HDSPlatformLogo className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600" />;
            classes.footerLogoRight = <MinistryOfEducationLogo className="w-10 h-10 sm:w-12 sm:h-12" />;
            break;
        case 'Premium Lifetime Subscription':
            classes.outerBorder = 'border-yellow-600';
            classes.innerBorder = 'border-yellow-700';
            classes.mainTitle = 'text-yellow-800';
            classes.studentName = 'text-yellow-900';
            classes.accentColor = 'text-yellow-700';
            classes.backgroundColor = 'bg-yellow-50';
            classes.badge = 'bg-yellow-600 text-white';
            classes.badgeIcon = <Crown className="h-4 w-4" />;
            classes.badgeText = 'Premium Lifetime';
            classes.headerLogoLeft = <HDSPlatformLogo className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-600" />;
            classes.footerLogoRight = <NSDCLogo className="w-10 h-10 sm:w-12 sm:h-12" />;
            break;
        case 'Pro Quarterly Subscription':
            classes.outerBorder = 'border-indigo-600';
            classes.innerBorder = 'border-indigo-700';
            classes.mainTitle = 'text-indigo-800';
            classes.studentName = 'text-indigo-900';
            classes.accentColor = 'text-indigo-700';
            classes.backgroundColor = 'bg-indigo-50';
            classes.badge = 'bg-indigo-600 text-white';
            classes.badgeIcon = <Briefcase className="h-4 w-4" />;
            classes.badgeText = 'Pro Quarterly';
            classes.headerLogoLeft = <HDSPlatformLogo className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-600" />;
            classes.footerLogoRight = <EmblemOfIndia className="w-10 h-14 sm:w-16 sm:h-20" />;
            break;
        default:
            // Default "Unknown" or standard design
            break;
    }
    return classes;
};

// --- Certificate Modal Component (Updated to use designProps and global SVGs) ---
const CertificateModal = ({ certificate, onClose }) => {
    const certificateRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

    const designProps = getCertificateDesignProps(certificate.courseDesignType);

    const handleDownload = () => {
        if (certificateRef.current === null) {
            return;
        }
        setIsDownloading(true);
        toPng(certificateRef.current, {
            cacheBust: true,
            backgroundColor: designProps.backgroundColor.replace('bg-', '#'), // Extract hex color
            pixelRatio: 3,
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `HDS-Certificate-${certificate.courseTitle.replace(/\s+/g, '-')}.png`;
                link.href = dataUrl;
                link.click();
                setIsDownloading(false);
            })
            .catch((err) => {
                console.error('Oops, something went wrong!', err);
                setIsDownloading(false);
            });
    };

    const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.verificationToken}`;

    const handleShare = async () => {
        const shareData = {
            title: `Certificate: ${certificate.courseTitle}`,
            text: `I earned a certificate for completing "${certificate.courseTitle}" on the HDS Platform!`,
            url: verificationUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(verificationUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            }
        } catch (err) {
            console.error("Couldn't share the certificate:", err);
            await navigator.clipboard.writeText(verificationUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const fullName = `${certificate.user?.profileInfo?.firstName || ''} ${certificate.user?.profileInfo?.lastName || 'Valued Student'}`;
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-body"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="relative bg-white rounded-lg shadow-2xl max-w-5xl w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <Link to={'/student/certificates'} className="absolute -top-4 -right-4 bg-white text-slate-600 rounded-full p-2 shadow-lg z-10 hover:bg-red-500 hover:text-white transition-all">
                    <X className="h-6 w-6" />
                </Link>

                <div ref={certificateRef} className={`${designProps.backgroundColor} p-2 lg:h-[80vh]`}>
                    <div className={`w-full h-full border-2 ${designProps.outerBorder} p-1 relative`}>
                        <div className={`w-full h-full border-4 ${designProps.innerBorder} p-4 relative text-center text-slate-800 flex flex-col`}>
                            <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                <AshokaChakra className={`w-2/3 h-2/3 ${designProps.accentColor}`} />
                            </div>

                            <div className="relative z-10 flex flex-col flex-grow">
                                <header className="flex justify-between items-center">
                                    <div className="text-left w-1/3 flex items-center gap-2">
                                        {designProps.headerLogoLeft}
                                        <div>
                                            <p className={`font-bold text-[8px] sm:text-base leading-tight font-body ${designProps.platformName}`}>HDS Platform</p>
                                            <p className="text-[6px] sm:text-xs leading-tight font-body">An ISO 9001:2015 Certified Organisation</p>
                                        </div>
                                    </div>
                                    {designProps.headerLogoCenter}
                                    <div className="text-right w-1/3 flex items-center justify-end gap-2">
                                        {designProps.headerLogoRight}
                                        <div>
                                            <p className="font-bold text-[8px] sm:text-base leading-tight font-body">Government of India</p>
                                            <p className="text-[6px] sm:text-xs leading-tight font-body">Ministry of Skill Development</p>
                                        </div>
                                    </div>
                                </header>

                                <div className="flex-grow flex flex-col justify-center my-2 sm:my-4">
                                    <p className={`font-display text-xl sm:text-4xl md:text-5xl ${designProps.mainTitle}`}>Certificate of Excellence</p>

                                    <p className="text-[8px] sm:text-sm mt-2 sm:mt-4 font-body">This is to certify that</p>

                                    <p className={`font-script text-2xl sm:text-4xl md:text-5xl my-1 sm:my-2 ${designProps.studentName}`}>{fullName}</p>

                                    <p className="text-[8px] sm:text-sm max-w-2xl mx-auto leading-snug font-body">
                                        has successfully completed the prescribed course of study in
                                        <br />
                                        <span className={`font-bold text-xs sm:text-xl my-1 sm:my-2 inline-block font-body ${designProps.accentColor}`}>{certificate.courseTitle}</span>
                                        <br />
                                        awarded on this day, {issueDate}.
                                    </p>
                                    {designProps.badge && (
                                        <div className={`mt-4 mx-auto px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${designProps.badge}`}>
                                            {designProps.badgeIcon}
                                            {designProps.badgeText}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <footer className="relative z-10 mt-auto flex justify-between items-end">
                                <div className="text-left flex items-end gap-2">
                                    {designProps.footerLogoLeft}
                                    <div>
                                        <p className="font-mono text-[6px] sm:text-xs">{certificate.certificateId}</p>
                                        <p className="text-[7px] sm:text-xs font-bold mt-1 font-body">Credential ID</p>
                                    </div>
                                </div>

                                <div className="flex items-end gap-4 sm:gap-8">
                                    <div className="text-center">
                                        <p className="font-script text-[7px] sm:text-xl">{certificate.instructorName}</p>
                                        <div className="w-full h-px bg-slate-500 my-1"></div>
                                        <p className="text-[6px] sm:text-xs font-bold font-body">Lead Instructor</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-script text-[7px] sm:text-xl">Director, HDS</p>
                                        <div className="w-full h-px bg-slate-500 my-1"></div>
                                        <p className="text-[6px] sm:text-xs font-bold font-body">Authorised Signatory</p>
                                    </div>
                                </div>

                                <div className="bg-white p-1 ml-4 flex items-end">
                                    {designProps.footerLogoRight}
                                    <div className="ml-2">
                                        <div className="block sm:hidden">
                                            <QRCodeCanvas value={verificationUrl} size={40} bgColor="#ffffff" fgColor="#000000" level="H" />
                                        </div>
                                        <div className="hidden sm:block">
                                            <QRCodeCanvas value={verificationUrl} size={80} bgColor="#ffffff" fgColor="#000000" level="H" />
                                        </div>
                                    </div>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex flex-col sm:flex-row justify-end items-center gap-3 bg-white rounded-b-lg border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-body">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Official & Verified Credential</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 rounded-md font-bold hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-wait font-body"
                        >
                            {isDownloading ? <><LoaderCircle className="animate-spin h-5 w-5" /> Processing...</> : <><Download className="h-5 w-5" /> Download</>}
                        </button>
                        <button onClick={handleShare} className="w-28 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition-all font-body">
                            <Share2 className="h-5 w-5" />
                            <span>{copied ? 'Copied!' : 'Share'}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main Page Component for single certificate view ---
const GetCertificateById = () => {
    const { certId } = useParams();
    const dispatch = useDispatch();
    const { selectedCertificate, loading, error } = useSelector((state) => state.certificates);

    useEffect(() => {
        if (certId) {
            dispatch(getCertificateById(certId));
        }
    }, [dispatch, certId]);

    if (loading) {
        return (
            <div className="bg-background min-h-screen font-sans p-8 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-background min-h-screen font-sans p-8 flex items-center justify-center">
                <ErrorMessage error={error} />
            </div>
        );
    }

    if (!selectedCertificate) {
        return (
            <div className="bg-background min-h-screen font-sans p-8 flex items-center justify-center text-center text-slate-600">
                <p>No certificate found with this ID.</p>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen font-sans p-8 flex items-center justify-center">
            <AnimatePresence>
                <CertificateModal certificate={selectedCertificate} onClose={() => window.history.back()} />
            </AnimatePresence>
        </div>
    );
};

export default GetCertificateById;
