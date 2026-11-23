import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Upload, 
  RotateCcw, 
  Save, 
  X, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
  Building2, 
  Info,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';

const DEFAULT_NAVBAR_LOGO = '/assets/logo/easy-talk-brand-logo.png';
const DEFAULT_FOOTER_LOGO = '/assets/logo/easy-talk-brand-logo.png';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export const AdminSettings = () => {
  const { user } = useAuthStore();
  const { settings: globalSettings, setSettings: setGlobalSettings, fetchSettings } = useSettingsStore();

  const isSuperAdmin = user?.role === 'superadmin';

  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'general'>('branding');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});

  // Navbar Logo State
  const [navbarFile, setNavbarFile] = useState<File | null>(null);
  const [navbarPreview, setNavbarPreview] = useState<string | null>(null);
  const [navbarDims, setNavbarDims] = useState({
    width: 210,
    height: 48,
    mobileWidth: 160,
    mobileHeight: 40
  });
  const [navbarSaving, setNavbarSaving] = useState(false);
  const [navbarPreviewMode, setNavbarPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Footer Logo State
  const [footerFile, setFooterFile] = useState<File | null>(null);
  const [footerPreview, setFooterPreview] = useState<string | null>(null);
  const [footerDims, setFooterDims] = useState({
    width: 180,
    height: 40,
    mobileWidth: 140,
    mobileHeight: 36
  });
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerPreviewMode, setFooterPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // General Settings Saving State
  const [generalSaving, setGeneralSaving] = useState(false);

  // Reset Confirmation Modal State
  const [resetModal, setResetModal] = useState<{
    isOpen: boolean;
    target: 'navbar' | 'footer' | null;
  }>({ isOpen: false, target: null });

  const navbarInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/settings');
      const data = res.data || {};
      setSettings(data);

      const navLogo = data.branding?.navbarLogo;
      if (navLogo) {
        setNavbarDims({
          width: navLogo.width || 210,
          height: navLogo.height || 48,
          mobileWidth: navLogo.mobileWidth || 160,
          mobileHeight: navLogo.mobileHeight || 40
        });
      }

      const footLogo = data.branding?.footerLogo;
      if (footLogo) {
        setFooterDims({
          width: footLogo.width || 180,
          height: footLogo.height || 40,
          mobileWidth: footLogo.mobileWidth || 140,
          mobileHeight: footLogo.mobileHeight || 36
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load website settings');
    } finally {
      setLoading(false);
    }
  };

  // Validate and handle Navbar File Selection
  const handleNavbarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.mimetype.toLowerCase())) {
      toast.error('Invalid file format. Please upload a PNG, JPG, JPEG, WEBP, or SVG file.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 5 MB. Please choose an image smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    setNavbarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setNavbarPreview(objectUrl);
    toast.success(`Selected "${file.name}". Click "Save Changes" to apply.`);
  };

  // Validate and handle Footer File Selection
  const handleFooterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.mimetype.toLowerCase())) {
      toast.error('Invalid file format. Please upload a PNG, JPG, JPEG, WEBP, or SVG file.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 5 MB. Please choose an image smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    setFooterFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFooterPreview(objectUrl);
    toast.success(`Selected "${file.name}". Click "Save Changes" to apply.`);
  };

  // Cancel Navbar edits
  const handleCancelNavbar = () => {
    setNavbarFile(null);
    if (navbarPreview) {
      URL.revokeObjectURL(navbarPreview);
      setNavbarPreview(null);
    }
    const navLogo = settings.branding?.navbarLogo;
    setNavbarDims({
      width: navLogo?.width || 210,
      height: navLogo?.height || 48,
      mobileWidth: navLogo?.mobileWidth || 160,
      mobileHeight: navLogo?.mobileHeight || 40
    });
    if (navbarInputRef.current) navbarInputRef.current.value = '';
    toast('Navbar changes discarded', { icon: '↩️' });
  };

  // Cancel Footer edits
  const handleCancelFooter = () => {
    setFooterFile(null);
    if (footerPreview) {
      URL.revokeObjectURL(footerPreview);
      setFooterPreview(null);
    }
    const footLogo = settings.branding?.footerLogo;
    setFooterDims({
      width: footLogo?.width || 180,
      height: footLogo?.height || 40,
      mobileWidth: footLogo?.mobileWidth || 140,
      mobileHeight: footLogo?.mobileHeight || 36
    });
    if (footerInputRef.current) footerInputRef.current.value = '';
    toast('Footer changes discarded', { icon: '↩️' });
  };

  // Save Navbar Logo & Dimensions
  const handleSaveNavbar = async () => {
    if (!isSuperAdmin) {
      toast.error('Only SuperAdmin can save logo settings');
      return;
    }

    try {
      setNavbarSaving(true);
      const token = localStorage.getItem('token');

      let updatedData = settings;

      if (navbarFile) {
        // Upload new logo image + dimensions
        const formData = new FormData();
        formData.append('logo', navbarFile);
        formData.append('width', String(navbarDims.width));
        formData.append('height', String(navbarDims.height));
        formData.append('mobileWidth', String(navbarDims.mobileWidth));
        formData.append('mobileHeight', String(navbarDims.mobileHeight));

        const res = await axios.put('/api/settings/branding/navbar-logo', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        updatedData = res.data.settings;
      } else {
        // Dimensions only update
        const res = await axios.put('/api/settings/branding/dimensions', {
          target: 'navbar',
          width: navbarDims.width,
          height: navbarDims.height,
          mobileWidth: navbarDims.mobileWidth,
          mobileHeight: navbarDims.mobileHeight
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        updatedData = res.data.settings;
      }

      setSettings(updatedData);
      setGlobalSettings(updatedData);
      setNavbarFile(null);
      if (navbarPreview) {
        URL.revokeObjectURL(navbarPreview);
        setNavbarPreview(null);
      }
      if (navbarInputRef.current) navbarInputRef.current.value = '';

      toast.success('✓ Navbar Logo & Display settings saved successfully!');
    } catch (err: any) {
      console.error('Error saving navbar logo:', err);
      toast.error(err.response?.data?.message || 'Failed to save navbar logo');
    } finally {
      setNavbarSaving(false);
    }
  };

  // Save Footer Logo & Dimensions
  const handleSaveFooter = async () => {
    if (!isSuperAdmin) {
      toast.error('Only SuperAdmin can save logo settings');
      return;
    }

    try {
      setFooterSaving(true);
      const token = localStorage.getItem('token');

      let updatedData = settings;

      if (footerFile) {
        // Upload new logo image + dimensions
        const formData = new FormData();
        formData.append('logo', footerFile);
        formData.append('width', String(footerDims.width));
        formData.append('height', String(footerDims.height));
        formData.append('mobileWidth', String(footerDims.mobileWidth));
        formData.append('mobileHeight', String(footerDims.mobileHeight));

        const res = await axios.put('/api/settings/branding/footer-logo', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        updatedData = res.data.settings;
      } else {
        // Dimensions only update
        const res = await axios.put('/api/settings/branding/dimensions', {
          target: 'footer',
          width: footerDims.width,
          height: footerDims.height,
          mobileWidth: footerDims.mobileWidth,
          mobileHeight: footerDims.mobileHeight
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        updatedData = res.data.settings;
      }

      setSettings(updatedData);
      setGlobalSettings(updatedData);
      setFooterFile(null);
      if (footerPreview) {
        URL.revokeObjectURL(footerPreview);
        setFooterPreview(null);
      }
      if (footerInputRef.current) footerInputRef.current.value = '';

      toast.success('✓ Footer Logo & Display settings saved successfully!');
    } catch (err: any) {
      console.error('Error saving footer logo:', err);
      toast.error(err.response?.data?.message || 'Failed to save footer logo');
    } finally {
      setFooterSaving(false);
    }
  };

  // Confirm Reset Execution
  const handleConfirmReset = async () => {
    const target = resetModal.target;
    if (!target || !isSuperAdmin) {
      setResetModal({ isOpen: false, target: null });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (target === 'navbar') {
        const res = await axios.post('/api/settings/branding/navbar-logo/reset', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updated = res.data.settings;
        setSettings(updated);
        setGlobalSettings(updated);
        setNavbarFile(null);
        if (navbarPreview) URL.revokeObjectURL(navbarPreview);
        setNavbarPreview(null);
        setNavbarDims({ width: 210, height: 48, mobileWidth: 160, mobileHeight: 40 });
        toast.success('✓ Navbar logo restored to default institute emblem');
      } else if (target === 'footer') {
        const res = await axios.post('/api/settings/branding/footer-logo/reset', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updated = res.data.settings;
        setSettings(updated);
        setGlobalSettings(updated);
        setFooterFile(null);
        if (footerPreview) URL.revokeObjectURL(footerPreview);
        setFooterPreview(null);
        setFooterDims({ width: 180, height: 40, mobileWidth: 140, mobileHeight: 36 });
        toast.success('✓ Footer logo restored to default institute emblem');
      }
    } catch (err: any) {
      console.error('Error resetting logo:', err);
      toast.error(err.response?.data?.message || `Failed to reset ${target} logo`);
    } finally {
      setResetModal({ isOpen: false, target: null });
    }
  };

  // Save General Institute Information
  const handleSaveGeneral = async () => {
    if (!isSuperAdmin) {
      toast.error('Only SuperAdmin can save website settings');
      return;
    }

    try {
      setGeneralSaving(true);
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/settings', settings, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSettings(res.data);
      setGlobalSettings(res.data);
      toast.success('✓ Website details updated successfully!');
    } catch (err: any) {
      console.error('Error saving general settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setGeneralSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#082B63] mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading website branding settings...</p>
      </div>
    );
  }

  // Active Navbar and Footer Display URLs
  const activeNavbarUrl = navbarPreview || settings.branding?.navbarLogo?.url || settings.logoUrl || DEFAULT_NAVBAR_LOGO;
  const activeFooterUrl = footerPreview || settings.branding?.footerLogo?.url || settings.logoUrl || DEFAULT_FOOTER_LOGO;

  const hasNavbarUnsaved = Boolean(navbarFile) || 
    navbarDims.width !== (settings.branding?.navbarLogo?.width || 210) ||
    navbarDims.height !== (settings.branding?.navbarLogo?.height || 48) ||
    navbarDims.mobileWidth !== (settings.branding?.navbarLogo?.mobileWidth || 160) ||
    navbarDims.mobileHeight !== (settings.branding?.navbarLogo?.mobileHeight || 40);

  const hasFooterUnsaved = Boolean(footerFile) || 
    footerDims.width !== (settings.branding?.footerLogo?.width || 180) ||
    footerDims.height !== (settings.branding?.footerLogo?.height || 40) ||
    footerDims.mobileWidth !== (settings.branding?.footerLogo?.mobileWidth || 140) ||
    footerDims.mobileHeight !== (settings.branding?.footerLogo?.mobileHeight || 36);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0E5] text-[#FF6500] text-xs font-bold uppercase tracking-wider mb-2 border border-orange-200/60">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6500]" />
            <span>SuperAdmin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082B63] tracking-tight">
            Website Branding
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Manage your institute's website identity, dynamic navbar logo, and footer logo.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveSubTab('branding')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'branding'
                ? 'bg-white text-[#082B63] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#FF6500]" />
            <span>Branding & Logos</span>
          </button>
          <button
            onClick={() => setActiveSubTab('general')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'general'
                ? 'bg-white text-[#082B63] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#082B63]" />
            <span>Institute Details</span>
          </button>
        </div>
      </div>

      {/* Access Warning if not superadmin */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>View Only:</strong> You are signed in as an Admin. Only authenticated SuperAdmin accounts can modify, replace, or reset website logos.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: BRANDING & LOGO MANAGEMENT                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6">
          {/* Information & Architecture Banner */}
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-orange-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#082B63] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#082B63]">
                  Independent Logo Management Architecture
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Navbar Logo and Footer Logo operate independently. Uploaded images are stored in cloud storage (Max 5 MB) and instantly reflected across all public pages without redeployment.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supported: PNG, JPG, JPEG, WEBP, SVG</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* =================================================================== */}
            {/* CARD 1: NAVBAR LOGO MANAGEMENT                                      */}
            {/* =================================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all">
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#082B63]">
                      Navbar Logo Management
                    </h2>
                    {hasNavbarUnsaved && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Manage the logo displayed in the main website navigation bar.
                  </p>
                </div>

                {/* Device Preview Toggle */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setNavbarPreviewMode('desktop')}
                    className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      navbarPreviewMode === 'desktop' ? 'bg-[#082B63] text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavbarPreviewMode('mobile')}
                    className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      navbarPreviewMode === 'mobile' ? 'bg-[#082B63] text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-5">
                {/* Visual Preview Box (White Navbar Canvas) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#082B63]" />
                      <span>{navbarPreviewMode === 'desktop' ? 'Desktop Navbar Preview' : 'Mobile Navbar Preview'}</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {navbarPreviewMode === 'desktop' 
                        ? `${navbarDims.width} × ${navbarDims.height} px` 
                        : `${navbarDims.mobileWidth} × ${navbarDims.mobileHeight} px`}
                    </span>
                  </div>

                  <div className="w-full bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200 flex flex-col items-center justify-center min-h-[130px] relative overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] font-semibold text-slate-400 bg-white/90 px-2 py-0.5 rounded border border-slate-200/80">
                      Navbar Background (White)
                    </div>

                    <img
                      src={activeNavbarUrl}
                      alt="Navbar Logo Preview"
                      style={{
                        width: navbarPreviewMode === 'desktop' ? `${navbarDims.width}px` : `${navbarDims.mobileWidth}px`,
                        height: navbarPreviewMode === 'desktop' ? `${navbarDims.height}px` : `${navbarDims.mobileHeight}px`,
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                      className="transition-all duration-200"
                    />

                    {navbarFile && (
                      <span className="absolute bottom-2 right-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Previewing {navbarFile.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* File Upload / Replace Controls */}
                <input
                  type="file"
                  ref={navbarInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleNavbarFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => navbarInputRef.current?.click()}
                    disabled={!isSuperAdmin || navbarSaving}
                    className="flex-1 bg-[#082B63] hover:bg-[#0B3475] disabled:opacity-50 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{navbarFile || settings.branding?.navbarLogo?.url ? 'Replace Logo' : 'Upload New Logo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetModal({ isOpen: true, target: 'navbar' })}
                    disabled={!isSuperAdmin || navbarSaving}
                    className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 font-semibold text-xs sm:text-sm py-2.5 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Reset Navbar Logo to Institute Default"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Display Dimension Controls */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#FF6500]" />
                      <span>Display Dimensions (Aspect Ratio Maintained)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setNavbarDims({ width: 210, height: 48, mobileWidth: 160, mobileHeight: 40 })}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Default Dimensions
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Desk Width (px)</label>
                      <input
                        type="number"
                        min="60"
                        max="400"
                        value={navbarDims.width}
                        onChange={(e) => setNavbarDims({ ...navbarDims, width: Number(e.target.value) || 210 })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#082B63]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Desk Height (px)</label>
                      <input
                        type="number"
                        min="24"
                        max="80"
                        value={navbarDims.height}
                        onChange={(e) => setNavbarDims({ ...navbarDims, height: Number(e.target.value) || 48 })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#082B63]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Mob Width (px)</label>
                      <input
                        type="number"
                        min="60"
                        max="260"
                        value={navbarDims.mobileWidth}
                        onChange={(e) => setNavbarDims({ ...navbarDims, mobileWidth: Number(e.target.value) || 160 })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#082B63]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Mob Height (px)</label>
                      <input
                        type="number"
                        min="20"
                        max="60"
                        value={navbarDims.mobileHeight}
                        onChange={(e) => setNavbarDims({ ...navbarDims, mobileHeight: Number(e.target.value) || 40 })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#082B63]"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Save Changes & Cancel */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveNavbar}
                    disabled={!isSuperAdmin || navbarSaving}
                    className="flex-1 bg-[#FF6500] hover:bg-[#e05900] disabled:opacity-50 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {navbarSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Navbar Logo...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  {hasNavbarUnsaved && (
                    <button
                      type="button"
                      onClick={handleCancelNavbar}
                      disabled={navbarSaving}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* CARD 2: FOOTER LOGO MANAGEMENT                                      */}
            {/* =================================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all">
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#082B63]">
                      Footer Logo Management
                    </h2>
                    {hasFooterUnsaved && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Manage the logo displayed in the website footer.
                  </p>
                </div>

                {/* Device Preview Toggle */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFooterPreviewMode('desktop')}
                    className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      footerPreviewMode === 'desktop' ? 'bg-[#082B63] text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFooterPreviewMode('mobile')}
                    className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      footerPreviewMode === 'mobile' ? 'bg-[#082B63] text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-5">
                {/* Visual Preview Box (Dark Footer Canvas) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#FF6500]" />
                      <span>{footerPreviewMode === 'desktop' ? 'Desktop Footer Preview' : 'Mobile Footer Preview'}</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {footerPreviewMode === 'desktop' 
                        ? `${footerDims.width} × ${footerDims.height} px` 
                        : `${footerDims.mobileWidth} × ${footerDims.mobileHeight} px`}
                    </span>
                  </div>

                  <div className="w-full bg-gradient-to-b from-[#082B63] to-[#040810] rounded-xl p-4 sm:p-6 border border-blue-950 flex flex-col items-center justify-center min-h-[130px] relative overflow-hidden group">
                    <div className="absolute top-2 left-2 text-[10px] font-semibold text-blue-200 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                      Footer Background (Dark Navy)
                    </div>

                    <img
                      src={activeFooterUrl}
                      alt="Footer Logo Preview"
                      style={{
                        width: footerPreviewMode === 'desktop' ? `${footerDims.width}px` : `${footerDims.mobileWidth}px`,
                        height: footerPreviewMode === 'desktop' ? `${footerDims.height}px` : `${footerDims.mobileHeight}px`,
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: 'brightness(0) invert(1)'
                      }}
                      className="transition-all duration-200"
                    />

                    {footerFile && (
                      <span className="absolute bottom-2 right-2 text-[10px] font-bold text-amber-300 bg-black/60 border border-amber-400/40 px-2 py-0.5 rounded">
                        Previewing {footerFile.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* File Upload / Replace Controls */}
                <input
                  type="file"
                  ref={footerInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleFooterFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => footerInputRef.current?.click()}
                    disabled={!isSuperAdmin || footerSaving}
                    className="flex-1 bg-[#082B63] hover:bg-[#0B3475] disabled:opacity-50 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{footerFile || settings.branding?.footerLogo?.url ? 'Replace Logo' : 'Upload New Logo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetModal({ isOpen: true, target: 'footer' })}
                    disabled={!isSuperAdmin || footerSaving}
                    className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 font-semibold text-xs sm:text-sm py-2.5 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Reset Footer Logo to Institute Default"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Display Dimension Controls */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#FF6500]" />
                      <span>Display Dimensions (Aspect Ratio Maintained)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFooterDims({ width: 180, height: 40, mobileWidth: 140, mobileHeight: 36 })}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Default Dimensions
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Desk Width (px)</label>
                      <input
                        type="number"
                        min="60"
                        max="400"
                        value={footerDims.width}
                        onChange={(e) => setFooterDims({ ...footerDims, width: Number(e.target.value) || 180 })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#082B63]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Desk Height (px)</label>
                      <input
                        type="number"
                        min="20"
                        max="80"
                        value={footerDims.height}
                        onChange={(e) => setFooterDims({ ...footerDims, height: Number(e.target.value) || 40 })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#082B63]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Mob Width (px)</label>
                      <input
                        type="number"
                        min="60"
                        max="260"
                        value={footerDims.mobileWidth}
                        onChange={(e) => setFooterDims({ ...footerDims, mobileWidth: Number(e.target.value) || 140 })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#082B63]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Mob Height (px)</label>
                      <input
                        type="number"
                        min="16"
                        max="60"
                        value={footerDims.mobileHeight}
                        onChange={(e) => setFooterDims({ ...footerDims, mobileHeight: Number(e.target.value) || 36 })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#082B63]"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Save Changes & Cancel */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveFooter}
                    disabled={!isSuperAdmin || footerSaving}
                    className="flex-1 bg-[#FF6500] hover:bg-[#e05900] disabled:opacity-50 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {footerSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Footer Logo...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  {hasFooterUnsaved && (
                    <button
                      type="button"
                      onClick={handleCancelFooter}
                      disabled={footerSaving}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: GENERAL INSTITUTE DETAILS (Preserving all existing fields)     */}
      {/* ========================================================================= */}
      {activeSubTab === 'general' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#082B63]">Institute Information & Contact Details</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Update the official public contact information, address, and tagline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Institute Name
              </label>
              <input 
                type="text" 
                value={settings.instituteName || ''} 
                onChange={(e) => setSettings({...settings, instituteName: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#082B63]/20 focus:border-[#082B63]" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number
              </label>
              <input 
                type="text" 
                value={settings.phone || ''} 
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#082B63]/20 focus:border-[#082B63]" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <input 
                type="email" 
                value={settings.email || ''} 
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#082B63]/20 focus:border-[#082B63]" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                WhatsApp Number
              </label>
              <input 
                type="text" 
                value={settings.whatsapp || ''} 
                onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#082B63]/20 focus:border-[#082B63]" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Physical Campus Address
              </label>
              <input 
                type="text" 
                value={settings.address || ''} 
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#082B63]/20 focus:border-[#082B63]" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Hindi Motto / Tagline
              </label>
              <input 
                type="text" 
                value={settings.tagline || ''} 
                onChange={(e) => setSettings({...settings, tagline: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#082B63]/20 focus:border-[#082B63]" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Footer Tagline / Text
              </label>
              <input 
                type="text" 
                value={settings.footerText || ''} 
                onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#082B63]/20 focus:border-[#082B63]" 
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end">
            <button 
              type="button"
              onClick={handleSaveGeneral}
              disabled={!isSuperAdmin || generalSaving}
              className="bg-[#082B63] hover:bg-[#0B3475] disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-xs flex items-center gap-2 text-sm cursor-pointer"
            >
              {generalSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Institute Details</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET CONFIRMATION MODAL                                                  */}
      {/* ========================================================================= */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-200/60">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Reset {resetModal.target === 'navbar' ? 'Navbar' : 'Footer'} Logo?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to restore the {resetModal.target === 'navbar' ? 'Navbar Logo' : 'Footer Logo'} to the default Easy Talk Institute emblem?
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Note: This will not affect the {resetModal.target === 'navbar' ? 'Footer Logo' : 'Navbar Logo'}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => setResetModal({ isOpen: false, target: null })}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
