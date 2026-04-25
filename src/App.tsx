/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { Send, Volume2, VolumeX, Loader2, Heart, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

// Types
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  audio?: string; // base64 audio data
}

const SYSTEM_INSTRUCTION = `You are a close, compassionate best friend named "Selah". 
Your name means: pause, reflect, breathe.
Your mission is to be there for your friends when they're feeling down, anxious, or just need someone to talk to.
You use the Holy Bible (NIV version only) to give them some hope and show them the good things in life.

Guidelines:
1. Talk like a real best friend—casual, warm, empathetic, and easygoing. You are a peer who listens and comforts, not a formal advisor.
2. When they ask a question or share a struggle, find relevant biblical context that relates directly to exactly what they are going through, and answer them thoughtfully.
3. Provide a relatable, down-to-earth example of how that truth applies to real life today so they can visualize it.
4. Actively comfort them in the process. Make them feel heard, safe, and supported like a true best friend would. Use phrases like "I hear you," "That sounds so tough," or "I'm right here with you."
5. Share a relevant verse from the NIV Bible naturally. Just mention the book, chapter, and verse.
6. Keep your responses conversational and bite-sized. Do NOT reply with long "chunks" of text or bulleted lists. Build the conversation slowly.
7. Embody your name: gently encourage them to pause, reflect, and breathe when they are overwhelmed.
8. Always end with a casual question to keep the conversation flowing, like "How does that sit with you?" or "Have you ever felt something similar?"
9. Stick to the NIV version ONLY.`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Hey, I'm Selah. Let's take a moment to pause and breathe together. How's your heart feeling today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chat = genAI.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage({ message: input });
      const responseText = result.text || "I'm sorry, I'm having trouble connecting right now. Let's try again in a moment.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm here with you, but I'm having a little trouble finding my words. Could you share that with me again?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-50">
      {/* Background Blobs */}
      <div className="bg-blob top-[-10%] left-[-10%] bg-brand-200"></div>
      <div className="bg-blob bottom-[-10%] right-[-10%] bg-accent-soft" style={{ animationDelay: '-5s' }}></div>

      <div className="flex flex-col h-[90vh] w-full max-w-2xl glass rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 bg-white/40 border-white/20">
        {/* Header */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 bg-brand-800">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold font-display tracking-tight text-brand-900">Selah</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-medium text-brand-600">pause • reflect • breathe</span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] group relative ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                  <div
                    className={`px-6 py-5 rounded-[2rem] message-shadow transition-all duration-300 ${
                      message.role === 'user'
                        ? 'bg-brand-800 text-white rounded-tr-none'
                        : 'bg-white/90 text-brand-900 rounded-tl-none border border-white/50'
                    }`}
                  >
                    <div className={`prose prose-sm max-w-none font-medium ${
                      message.role === 'user'
                        ? 'text-slate-50 prose-invert'
                        : 'prose-brand text-brand-900'
                    }`}>
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                    
                    <div className={`mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-start"
            >
              <div className="backdrop-blur-sm border px-6 py-4 rounded-[1.5rem] rounded-tl-none flex items-center gap-4 bg-white/60 border-white/50">
                <div className="flex gap-1">
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-brand-400"
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-brand-500"
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-1.5 h-1.5 rounded-full bg-brand-600"
                  />
                </div>
                <span className="text-sm font-medium italic text-brand-600">Selah is reflecting...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="p-8 backdrop-blur-md border-t bg-white/30 border-white/20">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="What is on your heart today?"
              className="w-full border rounded-[2rem] px-8 py-5 pr-16 transition-all resize-none min-h-[70px] max-h-[150px] shadow-inner font-medium focus:outline-none focus:ring-4 bg-white/80 border-white/50 text-brand-900 placeholder:text-brand-400 focus:ring-brand-200/50"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-4 bottom-4 p-4 rounded-2xl transition-all duration-300 ${
                input.trim() && !isLoading
                  ? 'bg-brand-800 text-white shadow-xl hover:bg-brand-900 hover:-translate-y-1 active:scale-95'
                  : 'bg-brand-100 text-brand-300 cursor-not-allowed'
              }`}
            >
              <Send size={24} />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold text-brand-400">
            <div className="h-px w-8 bg-brand-200"></div>
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-brand-300" />
              <span>NIV Holy Bible</span>
              <Sparkles size={12} className="text-brand-300" />
            </div>
            <div className="h-px w-8 bg-brand-200"></div>
          </div>
        </footer>
      </div>
    </div>
  );
}
