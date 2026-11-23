import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  MessageSquare, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  FileText,
  X
} from 'lucide-react';
import Logo from './Logo';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function Footer() {
  const { settings } = useSettingsStore();

  const phoneValue = settings.phone || '+91 9431885389';
  const rawPhone = (settings.phone || '+919431885389').replace(/\s+/g, '');
  const rawWhatsapp = (settings.whatsapp || '919431885389').replace(/\D/g, '');
  const emailValue = settings.email || 'siyaramkumar103@gmail.com';
  const addressValue = settings.address || 'प्राचीन देवी मंदिर के ठीक बगल में, 2nd Floor, PG Road, Jehanabad, Bihar';
  const instituteName = settings.instituteName || 'Easy Talk Institute';
  const taglineValue = settings.tagline || 'अंग्रेजी बोलना सीखें, बिल्कुल Basic से Advanced तक';
  const currentYear = new Date().getFullYear();

  // In-page modal state for Privacy Policy and Terms of Service
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // Quick navigation links as explicitly specified in Section B
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Batches', path: '/batches' },
    { name: 'Reading', path: '/reading' },
    { name: 'Testimonials', path: '/testimonials' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
  ];

  const googleMapsUrl = settings.googleMapUrl || 'https://maps.google.com/?q=Easy+Talk+Institute+Jehanabad+Bihar';

  return (
    <footer className="bg-gradient-to-b from-[#082B63] via-[#051B3E] to-[#030F24] text-slate-300 mt-10 sm:mt-16 md:mt-20 border-t-4 border-[#FF6500] relative overflow-hidden shadow-2xl">
      {/* Subtle background ambient lighting accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. MOBILE FOOTER (Visible on Mobile only: block md:hidden, < 768px)       */}
        {/* Compact, clean, minimal, zero bloat, strict mobile layout order           */}
        {/* ========================================================================= */}
        <div className="block md:hidden pt-8 pb-6 space-y-5 max-w-sm mx-auto px-2">
          
          {/* 1. Easy Talk Institute Logo */}
          <div className="text-center">
            <Link 
              to="/" 
              className="inline-block transition-transform active:scale-95"
              aria-label={`${instituteName} Home`}
            >
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-white/80 inline-flex items-center justify-center">
                <Logo 
                  variant="navbar"
                  isMobile={true}
                  imgClassName="h-9 w-auto max-w-[170px] object-contain"
                />
              </div>
            </Link>

            {/* 2. Hindi Tagline */}
            <p className="text-xs font-semibold text-[#FF8533] leading-snug px-2 mt-2.5">
              {taglineValue}
            </p>
          </div>

          {/* 3. Subtle Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-1" />

          {/* Hidden Quick Links to preserve JSX routes */}
          <div className="hidden md:block">
            {quickLinks.map((item) => (
              <Link key={item.name} to={item.path}>{item.name}</Link>
            ))}
          </div>

          {/* 4. Contact & Location */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 text-center">
              Contact & Location
            </h4>

            <div className="bg-white/[0.04] backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 space-y-2.5 shadow-inner">
              {/* Row 1: Location */}
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6500]" />
                </div>
                <span className="font-semibold text-slate-200">Jehanabad, Bihar</span>
              </div>

              {/* Row 2: Phone */}
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <a
                  href={`tel:${rawPhone}`}
                  className="font-medium text-slate-200 hover:text-white transition-colors truncate"
                >
                  {phoneValue}
                </a>
              </div>

              {/* Row 3: Email */}
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <a
                  href={`mailto:${emailValue}`}
                  className="font-medium text-slate-200 hover:text-white transition-colors truncate"
                >
                  {emailValue}
                </a>
              </div>
            </div>
          </div>

          {/* 5. Google Maps Link */}
          <div className="text-center pt-0.5">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-semibold text-[#FF8533] border border-white/10 transition-all shadow-xs"
              title="View on Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF6500] shrink-0" />
              <span>View on Google Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            </a>
          </div>

          {/* 6. Connect With Us (LinkedIn + GitHub only) */}
          <div className="text-center space-y-2 pt-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Connect With Us
            </span>
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://www.linkedin.com/in/siyaram-kumar-dev/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#FF6500] active:bg-[#FF6500] text-blue-100 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 shadow-2xs active:scale-95 group"
              >
                <Linkedin className="w-4 h-4 transition-transform group-hover:scale-110" />
              </a>
              <a
                href="https://github.com/siyaramkumar1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#FF6500] active:bg-[#FF6500] text-blue-100 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 shadow-2xs active:scale-95 group"
              >
                <Github className="w-4 h-4 transition-transform group-hover:scale-110" />
              </a>
            </div>
          </div>

          {/* 7. Privacy Policy | Terms of Service */}
          <div className="flex items-center justify-center gap-3.5 text-xs font-medium text-slate-400 pt-1">
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="hover:text-white active:underline transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-600 select-none">•</span>
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="hover:text-white active:underline transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>

          {/* 8. Call Now and WhatsApp Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={`tel:${rawPhone}`}
              className="h-11 min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-950/40 border border-blue-400/20 transition-all cursor-pointer px-2 min-w-0"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Call Now</span>
            </a>

            <a
              href={`https://wa.me/${rawWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 border border-emerald-400/20 transition-all cursor-pointer px-2 min-w-0"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </a>
          </div>

          {/* 9. Copyright Section */}
          <div className="pt-3.5 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
              &copy; {currentYear} {instituteName}. All rights reserved.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP & TABLET FOOTER (Visible on md and above: hidden md:block)     */}
        {/* Preserves 100% of existing rich multi-column desktop layout & descriptions*/}
        {/* ========================================================================= */}
        <div className="hidden md:block pt-10 sm:pt-14 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
            
            {/* SECTION A – BRAND INFORMATION (4 Columns on Desktop) */}
            <div className="lg:col-span-4 flex flex-col items-start space-y-4">
              <Link 
                to="/" 
                className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98] group"
                aria-label={`${instituteName} Home`}
              >
                <div className="bg-white px-3.5 py-2 rounded-2xl shadow-sm border border-white/80 inline-flex items-center justify-center">
                  <Logo 
                    variant="navbar"
                    imgClassName="h-10 sm:h-11 w-auto max-w-[210px] object-contain"
                  />
                </div>
              </Link>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {instituteName}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#FF8533] mt-1 leading-snug">
                  {taglineValue}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                {settings.footerText || 'Transforming careers through effective communication.'}
              </p>

              <div className="pt-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Connect With Us
                </span>
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://www.linkedin.com/in/siyaram-kumar-dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#FF6500] text-blue-100 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-transparent hover:-translate-y-0.5 shadow-2xs"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href="https://github.com/siyaramkumar1"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#FF6500] text-blue-100 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-transparent hover:-translate-y-0.5 shadow-2xs"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* SECTION B – QUICK LINKS (3 Columns on Desktop) */}
            <div className="lg:col-span-3 flex flex-col">
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 tracking-tight flex items-center gap-2 relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-8 after:h-0.5 after:bg-[#FF6500] after:rounded-full">
                Quick Links
              </h4>

              <ul className="space-y-2.5 mt-2">
                {quickLinks.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className="group flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-[#FF8533] transition-all duration-150 py-0.5 font-medium"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF8533] group-hover:translate-x-1 transition-transform shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* SECTION C – CONTACT & LOCATION (3 Columns on Desktop) */}
            <div className="lg:col-span-3 flex flex-col space-y-3.5">
              <h4 className="text-white font-bold text-base sm:text-lg mb-1 tracking-tight relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-8 after:h-0.5 after:bg-[#FF6500] after:rounded-full">
                Contact & Location
              </h4>

              <div className="space-y-3 mt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 hover:text-white transition-colors"
                  title="Open location on Google Maps"
                >
                  <MapPin className="w-4 h-4 text-[#FF6500] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="leading-relaxed">
                    {addressValue}
                  </span>
                </a>

                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <Phone className="w-4 h-4 text-[#FF6500] shrink-0" />
                  <a
                    href={`tel:${rawPhone}`}
                    className="text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
                    title="Call Institute"
                  >
                    {phoneValue}
                  </a>
                </div>

                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href={`https://wa.me/${rawWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-emerald-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
                    title="Chat on WhatsApp"
                  >
                    <span>+91 9431885389</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>

                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <Mail className="w-4 h-4 text-[#FF6500] shrink-0" />
                  <a
                    href={`mailto:${emailValue}`}
                    className="text-slate-300 hover:text-white font-medium transition-colors break-all"
                    title="Send Email"
                  >
                    {emailValue}
                  </a>
                </div>
              </div>

              <div className="pt-1">
                <a 
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                  title="Open in Google Maps"
                >
                  <div className="rounded-xl overflow-hidden shadow-xs h-24 bg-slate-900 border border-white/10 relative">
                    <iframe 
                      src={settings.googleMapUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14392.348636450654!2d84.97864459999999!3d25.148142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f2d7bf83cdb00b%3A0xb35fa324080eb2df!2sJehanabad%2C%20Bihar!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"}
                      width="100%" 
                      height="100%" 
                      style={{ border: 0, pointerEvents: 'none' }} 
                      allowFullScreen={false} 
                      loading="lazy" 
                      title="Easy Talk Institute Location"
                      className="absolute inset-0 grayscale contrast-125 opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-blue-950/20 group-hover:bg-transparent transition-colors flex items-center justify-center pointer-events-none">
                      <span className="bg-slate-950/80 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/20 backdrop-blur-xs flex items-center gap-1 group-hover:bg-[#FF6500] transition-colors">
                        <MapPin className="w-2.5 h-2.5" /> View on Google Maps
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* SECTION D – LEGAL INFORMATION (2 Columns on Desktop) */}
            <div className="lg:col-span-2 flex flex-col space-y-3">
              <h4 className="text-white font-bold text-base sm:text-lg mb-1 tracking-tight relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-8 after:h-0.5 after:bg-[#FF6500] after:rounded-full">
                Legal
              </h4>

              <ul className="space-y-2 mt-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white transition-colors cursor-pointer text-left py-1"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#FF8533] shrink-0" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white transition-colors cursor-pointer text-left py-1"
                  >
                    <FileText className="w-4 h-4 text-[#FF8533] shrink-0" />
                    <span>Terms of Service</span>
                  </button>
                </li>
              </ul>

              <div className="mt-4 p-3 bg-white/[0.04] rounded-xl border border-white/10 text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Certified Institute
                </p>
                <p className="text-slate-400 leading-tight">
                  Government registered institute empowering students in Spoken English & Career Communication.
                </p>
              </div>
            </div>

          </div>

          {/* Desktop Footer Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p className="text-center sm:text-left font-normal">
              &copy; {currentYear} {instituteName}. All rights reserved.
            </p>

            <div className="flex items-center gap-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-600 select-none">•</span>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* IN-PAGE LEGAL MODAL (Available for both mobile and desktop)                */}
      {/* ========================================================================= */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                {legalModal === 'privacy' ? (
                  <ShieldCheck className="w-5 h-5 text-[#082B63]" />
                ) : (
                  <FileText className="w-5 h-5 text-[#082B63]" />
                )}
                <h3 className="font-bold text-base sm:text-lg text-[#082B63]">
                  {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {legalModal === 'privacy' ? (
                <>
                  <p>
                    Welcome to <strong>{instituteName}</strong>. We value your trust and are committed to protecting your personal information.
                  </p>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">1. Information Collection</h4>
                    <p>We collect personal details such as student name, phone number, and email address solely for course admissions, academic notifications, and batch schedule communications.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">2. Information Usage</h4>
                    <p>Your contact details are strictly kept confidential and used exclusively for your learning journey and placement preparation under Siyaram Kumar.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">3. Contact for Inquiries</h4>
                    <p>If you have any questions regarding your data privacy, reach out to us at <strong>{emailValue}</strong> or call <strong>{phoneValue}</strong>.</p>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    By enrolling in courses or accessing services provided by <strong>{instituteName}</strong>, you agree to the following terms:
                  </p>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">1. Academic Discipline</h4>
                    <p>Students are expected to maintain regular attendance, complete assignments, and participate constructively in group discussions and mock sessions.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">2. Course Material & Copyright</h4>
                    <p>All study resources, bilingual reading materials, and curriculum notes provided by Easy Talk Institute are protected and intended solely for enrolled students.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">3. Batch Timings</h4>
                    <p>The institute reserves the right to reschedule cohort timings during holidays or examination periods with prior notification.</p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-5 py-2 rounded-xl bg-[#082B63] hover:bg-[#0B3475] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
