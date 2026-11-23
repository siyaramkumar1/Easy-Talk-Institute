import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';

interface LogoProps {
  className?: string;
  imgClassName?: string;
  dark?: boolean;
  variant?: 'navbar' | 'footer' | 'default';
  isMobile?: boolean;
}

const DEFAULT_LOGO = '/assets/logo/easy-talk-brand-logo.png';

export default function Logo({ 
  className = '', 
  imgClassName, 
  dark = false,
  variant = 'default',
  isMobile = false
}: LogoProps) {
  const { settings } = useSettingsStore();

  const logoConfig = settings?.branding?.navbarLogo || null;
  const targetUrl = logoConfig?.url || settings?.logoUrl || DEFAULT_LOGO;
  const [currentSrc, setCurrentSrc] = useState(targetUrl);

  useEffect(() => {
    if (targetUrl) {
      setCurrentSrc(targetUrl);
    }
  }, [targetUrl]);

  const handleImageError = () => {
    if (currentSrc !== DEFAULT_LOGO) {
      setCurrentSrc(DEFAULT_LOGO);
    }
  };

  const customWidth = isMobile
    ? (logoConfig?.mobileWidth || (variant === 'navbar' ? 160 : 140))
    : (logoConfig?.width || (variant === 'navbar' ? 210 : 180));

  const customHeight = isMobile
    ? (logoConfig?.mobileHeight || (variant === 'navbar' ? 40 : 36))
    : (logoConfig?.height || (variant === 'navbar' ? 48 : 40));

  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={currentSrc}
        alt={settings.instituteName || "Easy Talk Institute"}
        onError={handleImageError}
        style={{
          width: customWidth ? `${customWidth}px` : undefined,
          height: customHeight ? `${customHeight}px` : undefined,
          maxWidth: '100%',
          objectFit: 'contain',
          ...(dark ? { filter: 'brightness(0) invert(1)' } : {})
        }}
        className={imgClassName || "w-auto object-contain transition-all duration-200"}
      />
    </div>
  );
}
