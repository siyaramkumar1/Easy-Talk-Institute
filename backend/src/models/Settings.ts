import mongoose, { Document } from 'mongoose';

export interface ILogoDetails {
  url: string;
  publicId?: string;
  width: number;
  height: number;
  mobileWidth: number;
  mobileHeight: number;
  updatedAt: Date;
}

export interface ISettings extends Document {
  instituteName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  logoUrl: string;
  logoPublicId?: string;
  branding: {
    navbarLogo: ILogoDetails;
    footerLogo: ILogoDetails;
  };
  faviconUrl: string;
  footerText: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  googleMapUrl: string;
  metaTitle: string;
  metaDescription: string;
}

const logoDetailsSchema = new mongoose.Schema({
  url: { type: String, default: '/assets/logo/easy-talk-brand-logo.png' },
  publicId: { type: String, default: '' },
  width: { type: Number, default: 210 },
  height: { type: Number, default: 48 },
  mobileWidth: { type: Number, default: 160 },
  mobileHeight: { type: Number, default: 40 },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const settingsSchema = new mongoose.Schema<ISettings>({
  instituteName: { type: String, default: 'Easy Talk Institute' },
  tagline: { type: String, default: 'अंग्रेजी बोलना सीखें, बिल्कुल Basic से Advanced तक' },
  address: { type: String, default: 'प्राचीन देवी मंदिर के ठीक बगल में, 2nd Floor, PG Road, Jehanabad, Bihar' },
  phone: { type: String, default: '+91 9431885389' },
  email: { type: String, default: 'siyaramkumar103@gmail.com' },
  whatsapp: { type: String, default: '+919431885389' },
  logoUrl: { type: String, default: '/assets/logo/easy-talk-brand-logo.png' },
  logoPublicId: { type: String, default: '' },
  branding: {
    navbarLogo: {
      type: logoDetailsSchema,
      default: () => ({
        url: '/assets/logo/easy-talk-brand-logo.png',
        publicId: '',
        width: 210,
        height: 48,
        mobileWidth: 160,
        mobileHeight: 40,
        updatedAt: new Date()
      })
    },
    footerLogo: {
      type: logoDetailsSchema,
      default: () => ({
        url: '/assets/logo/easy-talk-brand-logo.png',
        publicId: '',
        width: 180,
        height: 40,
        mobileWidth: 140,
        mobileHeight: 36,
        updatedAt: new Date()
      })
    }
  },
  faviconUrl: { type: String, default: '/vite.svg' },
  footerText: { type: String, default: 'Transforming careers through effective communication.' },
  facebookUrl: { type: String, default: '#' },
  instagramUrl: { type: String, default: '#' },
  twitterUrl: { type: String, default: '#' },
  youtubeUrl: { type: String, default: '#' },
  googleMapUrl: { type: String, default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14392.348636450654!2d84.97864459999999!3d25.148142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f2d7bf83cdb00b%3A0xb35fa324080eb2df!2sJehanabad%2C%20Bihar!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin' },
  metaTitle: { type: String, default: 'Easy Talk Institute' },
  metaDescription: { type: String, default: 'Learn Spoken English in Jehanabad.' },
}, { timestamps: true });

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
