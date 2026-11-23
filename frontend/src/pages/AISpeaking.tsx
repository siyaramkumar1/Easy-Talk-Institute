import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, RefreshCw, AlertCircle, CheckCircle, Volume2 } from 'lucide-react';
import axios from 'axios';

interface Message {
  role: 'user' | 'ai';
  text: string;
  time: string;
}

export default function AISpeaking() {
  const [topic, setTopic] = useState('Daily Routine & Introduction');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Hello! I am your Easy Talk AI English Partner. What would you like to talk about today? Tell me a little bit about yourself or how your day is going!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; message?: string }>({ configured: true });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check AI backend readiness
    axios.get('/api/ai/status')
      .then(res => {
        setAiStatus({ configured: res.data.configured });
      })
      .catch(() => {
        setAiStatus({ configured: false, message: 'AI service endpoint unreachable' });
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/practice', {
        message: text,
        topic,
        history: messages.slice(-4)
      });

      const aiReply = res.data.reply || 'Great effort! Keep practicing.';
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'AI speaking partner is momentarily busy. Please try again.';
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: `Notice: ${errMsg}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your browser. Please type your message.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsRecording(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ''));
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">AI Speaking Partner</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">Live English practice with instant AI feedback</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Topic:</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Daily Routine & Introduction">Daily Routine & Intro</option>
              <option value="Job Interview Practice">Job Interview</option>
              <option value="Travel & Dining Out">Travel & Dining</option>
              <option value="Professional Office English">Office & Meetings</option>
              <option value="Grammar & Fluency Drill">Grammar Drills</option>
            </select>
          </div>
        </div>

        {/* AI Key Status Warning if not configured */}
        {!aiStatus.configured && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">AI Assistant in Standard Mode</p>
              <p className="text-amber-700 mt-0.5">
                Gemini API Key is currently waiting for configuration in environment secrets. You can still test interface features and type messages.
              </p>
            </div>
          </div>
        )}

        {/* Chat Conversation Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[520px]">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 text-[10px] opacity-75">
                    <span>{m.time}</span>
                    {m.role === 'ai' && (
                      <button
                        onClick={() => speakText(m.text)}
                        title="Listen to audio"
                        className="hover:opacity-100 flex items-center gap-1 transition-opacity ml-2 text-indigo-700 font-medium"
                      >
                        <Volume2 className="w-3 h-3" /> Listen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  AI
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-500 rounded-tl-none border border-slate-200/60 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Easy Talk AI is listening & preparing feedback...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Controls */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-3 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title={isRecording ? 'Listening... click to stop' : 'Click to speak'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-indigo-600" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? 'Listening to your speech...' : 'Type your answer or conversation topic...'}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Tip: Practice speaking out loud for best retention</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle className="w-3 h-3" /> Voice & Text Supported
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

