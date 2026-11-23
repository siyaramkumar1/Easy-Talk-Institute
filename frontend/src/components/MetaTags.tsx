import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export const MetaTags = () => {
  const { settings } = useSettingsStore();

  useEffect(() => {
    if (settings.metaTitle) {
      document.title = settings.metaTitle;
    }
    if (settings.metaDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', settings.metaDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = settings.metaDescription;
        document.head.appendChild(meta);
      }
    }
    if (settings.faviconUrl) {
      const link = document.querySelector('link[rel="icon"]');
      if (link) {
        link.setAttribute('href', settings.faviconUrl);
      }
    }
  }, [settings]);

  return null;
};
