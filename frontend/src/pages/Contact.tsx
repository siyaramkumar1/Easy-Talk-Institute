import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useSettingsStore } from '../store/useSettingsStore';

export default function Contact() {
  const { settings } = useSettingsStore();
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const phoneValue = settings.phone || '+91 9431885389';
  const whatsappValue = settings.whatsapp || '919431885389';
  const emailValue = settings.email || 'siyaramkumar103@gmail.com';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axios.post('/api/contact', formData);
      setSuccessMsg('Your message has been sent successfully!\nWe will get back to you soon.');
      setFormData({
        fullName: '',
        mobile: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed To Send Message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen overflow-x-hidden pb-10 sm:pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* CONTACT HERO SECTION                                      */}
        {/* Top Padding: pt-6 mobile                                  */}
        {/* Bottom Padding: pb-6 mobile                               */}
        {/* Content Width: max-w-full, Center aligned                 */}
        {/* Spacing: Title → mb-3, Description → mb-6                */}
        {/* ========================================================= */}
        <div className="pt-6 pb-6 text-center max-w-full mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-950 mb-3 tracking-tight">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-6 leading-relaxed">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* ========================================================= */}
        {/* MAIN CONTENT GRID                                         */}
        {/* Spacing between sections: 24px+ (gap-6 lg:gap-8 xl:gap-12)*/}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12 items-start">
          
          {/* ======================================================= */}
          {/* GET IN TOUCH CARDS                                      */}
          {/* Phone Card, WhatsApp Card, Email Card                   */}
          {/* Rounded XL, Proper shadow, Full width on mobile         */}
          {/* Padding 16px–20px, Gap between cards 12px–16px          */}
          {/* Touch friendly, stacked vertically on mobile            */}
          {/* ======================================================= */}
          <div className="lg:col-span-1 w-full flex flex-col gap-3 sm:gap-4">
            
            {/* Phone Card */}
            <a
              href="tel:+919431885389"
              className="w-full bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex items-center gap-3.5 sm:gap-4 cursor-pointer active:scale-[0.99]"
              title="Call Us Directly"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-2xs">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</p>
                <p className="text-sm sm:text-base font-bold text-slate-800 truncate">{phoneValue}</p>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">Click to Call Now</p>
              </div>
            </a>

            {/* WhatsApp Card */}
            <a
              href="https://wa.me/919431885389"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group flex items-center gap-3.5 sm:gap-4 cursor-pointer active:scale-[0.99]"
              title="Chat on WhatsApp"
            >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">WhatsApp</p>
                <p className="text-sm sm:text-base font-bold text-slate-800 truncate">+91 9431885389</p>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">Chat with us on WhatsApp</p>
              </div>
            </a>

            {/* Email Card */}
            <a
              href="mailto:siyaramkumar103@gmail.com"
              className="w-full bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group flex items-center gap-3.5 sm:gap-4 cursor-pointer active:scale-[0.99]"
              title="Send an Email"
            >
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-2xs">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                <p className="text-sm sm:text-base font-bold text-slate-800 truncate">{emailValue}</p>
                <p className="text-xs text-orange-600 font-semibold mt-0.5">Click to Send Email</p>
              </div>
            </a>
          </div>

          {/* ======================================================= */}
          {/* CONTACT FORM CARD                                       */}
          {/* Wrap entire form inside:                                */}
          {/* White card, Rounded 2xl, Shadow, Padding 20px mobile   */}
          {/* Field height: min-h-[48px], padding px-4 py-3           */}
          {/* Label → Input = 6px (mb-1.5), Input → Next = 16px (mb-4)*/}
          {/* Textarea: min-h-[120px]                                 */}
          {/* Button: Full width, Height 52px, Rounded XL             */}
          {/* ======================================================= */}
          <div className="lg:col-span-2 w-full mt-6 lg:mt-0">
            <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl border border-slate-200/90 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-950 mb-6 sm:mb-8 tracking-tight">
                Send a Message
              </h2>
              
              {successMsg && (
                <div className="mb-6 p-4 sm:p-5 bg-green-50 text-green-700 border border-green-200 rounded-xl whitespace-pre-line text-center animate-fade-in">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="font-semibold text-sm sm:text-base">{successMsg}</p>
                </div>
              )}

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-center font-medium text-sm">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full">
                {/* Full Name & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-4">
                  {/* Full Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500 font-semibold">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm sm:text-base transition-all bg-white"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Mobile */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Mobile / WhatsApp <span className="text-red-500 font-semibold">*</span>
                    </label>
                    <input 
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      maxLength={10}
                      required
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '');
                        handleChange(e);
                      }}
                      className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm sm:text-base transition-all bg-white"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                
                {/* Email Address */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm sm:text-base transition-all bg-white"
                    placeholder="john@example.com"
                  />
                </div>
                
                {/* Subject */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subject <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm sm:text-base transition-all bg-white"
                    placeholder="How can we help you?"
                  />
                </div>
                
                {/* Message */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Message <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <textarea 
                    rows={4}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm sm:text-base transition-all bg-white resize-y"
                    placeholder="Write your message here..."
                  />
                </div>
                
                {/* Submit Button */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-[52px] min-h-[52px] bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
