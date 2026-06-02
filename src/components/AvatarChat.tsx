"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Send, Download, Volume2, VolumeX, HelpCircle, ArrowRight, ArrowLeft, Bot, User } from 'lucide-react';

// Saubere Typisierung der Web Speech API ohne 'any'
interface ISpeechRecognitionEvent {
    resultIndex: number;
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
            };
        };
    };
}

interface ISpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: () => void;
    onend: () => void;
    onresult: (event: ISpeechRecognitionEvent) => void;
    onerror: (event: unknown) => void;
    start: () => void;
    stop: () => void;
}

declare global {
    interface Window {
        SpeechRecognition?: new () => ISpeechRecognition;
        webkitSpeechRecognition?: new () => ISpeechRecognition;
    }
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AvatarChatProps {
    initialMessage?: string;
    topic?: string;
    showVoiceHints?: boolean;
    pageContext?: string;
    moduleNumber?: number;
}

// Erwartetes Request-Format deines API-Proxys
interface AvatarChatRequest {
    message: string;
    pflegegrad?: number | null;
    module?: string[];
    sessionId?: string;
    context?: {
        previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
        userProfile?: {
            age?: number;
            careSituation?: string;
            federalState?: string;
        };
    };
}

// Erwartetes Antwort-Format deines API-Proxys
interface AvatarChatResponse {
    text: string;
    action?: {
        type: 'show_module' | 'open_calculator' | 'start_assessment' | 'generate_pdf' | 'navigate';
        payload?: Record<string, unknown>;
    };
    suggestions?: string[];
    sources?: Array<{
        title: string;
        url?: string;
        sgb?: string;
        paragraph?: string;
    }>;
}

const VOICE_COMMANDS = {
    HILFE: ['hilfe', 'help', 'assistent', 'unterstützung'],
    WEITER: ['weiter', 'next', 'fortfahren', 'continue'],
    ZURÜCK: ['zurück', 'back', 'zurueck', 'vorherige'],
};

export default function AvatarChat({
                                       initialMessage = "Hallo! Ich bin Ihr PflegeNavigator Assistent. Wie kann ich Ihnen helfen?",
                                       topic = "allgemein",
                                       showVoiceHints = true
                                   }: AvatarChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: initialMessage, timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [avatarAnimation, setAvatarAnimation] = useState<'idle' | 'talking' | 'listening'>('idle');
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [showHints, setShowHints] = useState(showVoiceHints);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<ISpeechRecognition | null>(null);
    const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialisierung der Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'de-DE';

                recognition.onstart = () => {
                    setIsListening(true);
                    setAvatarAnimation('listening');
                };

                recognition.onend = () => {
                    setIsListening(false);
                    setAvatarAnimation('idle');
                };

                recognition.onresult = (event: ISpeechRecognitionEvent) => {
                    const transcript = event.results[0][0].transcript;
                    handleVoiceCommand(transcript);
                };

                recognition.onerror = () => {
                    setIsListening(false);
                    setAvatarAnimation('idle');
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    // Sprachausgabe (Text-to-Speech)
    const speakText = useCallback((text: string) => {
        if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setAvatarAnimation('talking');
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setAvatarAnimation('idle');
        };

        synthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [voiceEnabled]);

    // Zentraler Nachrichten-Sender an den Next.js API Proxy
    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Mapping auf das von deinem Proxy erwartete AvatarChatRequest-Interface
            const requestPayload: AvatarChatRequest = {
                message: text,
                module: [topic],
                context: {
                    previousMessages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }
            };

            const response = await fetch('/api/avatar/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) throw new Error('API Error');

            const data: AvatarChatResponse = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.text,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (voiceEnabled) {
                speakText(data.text);
            }
        } catch (error) {
            console.error("Chat-Fehler:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Entschuldigung, es gab einen Fehler bei der Übertragung. Bitte versuchen Sie es erneut.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Voice Commands Handler
    const handleVoiceCommand = useCallback((transcript: string) => {
        const lowerText = transcript.toLowerCase();

        if (VOICE_COMMANDS.HILFE.some(cmd => lowerText.includes(cmd))) {
            sendMessage("Ich brauche Hilfe beim Pflegeantrag");
            return;
        }
        if (VOICE_COMMANDS.WEITER.some(cmd => lowerText.includes(cmd))) {
            sendMessage("Weiter zum nächsten Schritt");
            return;
        }
        if (VOICE_COMMANDS.ZURÜCK.some(cmd => lowerText.includes(cmd))) {
            sendMessage("Zurück zum vorherigen Schritt");
            return;
        }

        sendMessage(transcript);
    }, [messages]);

    const startListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.start();
        }
    };

    const downloadChat = () => {
        const chatText = messages.map(m =>
            `${m.role === 'user' ? 'Sie' : 'Assistent'} (${m.timestamp.toLocaleTimeString()}):\n${m.content}\n---\n`
        ).join('\n');

        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pflegenavigator-chat-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border border-white/10 text-white overflow-hidden">
            {/* Header */}
            <div className="bg-slate-950/60 p-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all duration-300 ${
                            avatarAnimation === 'talking' ? 'scale-105 bg-[#20b2aa]/20' : ''
                        } ${avatarAnimation === 'listening' ? 'ring-2 ring-amber-400' : ''}`}>
                            <Bot className={`w-5 h-5 ${avatarAnimation === 'talking' ? 'text-[#20b2aa]' : 'text-white'}`} />
                        </div>
                        {avatarAnimation === 'listening' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                        )}
                        {avatarAnimation === 'talking' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">PflegeNavigator Assistent</h3>
                        <p className="text-gray-400 text-xs">
                            {isListening ? 'Hört zu...' : isSpeaking ? 'Spricht...' : 'Bereit'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
                        title={voiceEnabled ? 'Sprachausgabe aus' : 'Sprachausgabe an'}
                    >
                        {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={downloadChat}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
                        title="Chat herunterladen"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Voice Hints */}
            {showHints && (
                <div className="bg-amber-500/10 px-4 py-2 flex items-center gap-2 text-xs text-amber-300 border-b border-amber-500/20">
                    <span className="font-medium flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> Befehle:
                    </span>
                    <span className="bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/10">Hilfe</span>
                    <span className="bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/10">Weiter</span>
                    <span className="bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/10">Zurück</span>
                    <button
                        onClick={() => setShowHints(false)}
                        className="ml-auto text-amber-500 hover:text-amber-300"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user' ? 'bg-[#20b2aa]' : 'bg-slate-800'
                        }`}>
                            {message.role === 'user' ? (
                                <User className="w-4 h-4 text-slate-950" />
                            ) : (
                                <Bot className="w-4 h-4 text-white" />
                            )}
                        </div>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                            message.role === 'user'
                                ? 'bg-[#20b2aa] text-slate-950 rounded-tr-none font-medium'
                                : 'bg-slate-900 border border-white/5 text-gray-100 rounded-tl-none'
                        }`}>
                            <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <span className={`text-[10px] mt-1 block text-right ${
                                message.role === 'user' ? 'text-slate-800' : 'text-gray-500'
                            }`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-slate-900 border border-white/5 rounded-xl rounded-tl-none px-3 py-2 shadow-sm flex items-center">
                            <div className="flex gap-1 py-1">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-950/40 border-t border-white/10">
                <div className="flex gap-2">
                    <button
                        onClick={startListening}
                        disabled={isListening}
                        className={`p-2.5 rounded-xl transition-all border ${
                            isListening
                                ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                                : 'bg-slate-900 border-white/5 text-gray-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <Mic className="w-4 h-4" />
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
                        placeholder="Frage stellen..."
                        className="flex-1 bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#20b2aa] placeholder-gray-500"
                    />
                    <button
                        onClick={() => sendMessage(inputText)}
                        disabled={!inputText.trim() || isLoading}
                        className="p-2.5 bg-[#20b2aa] text-slate-950 font-bold rounded-xl hover:bg-[#1a9994] disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-1.5 mt-2.5 justify-center">
                    <button
                        onClick={() => sendMessage("Hilfe")}
                        className="px-2.5 py-1 bg-slate-900 border border-white/5 rounded-full text-[11px] text-gray-400 hover:text-white hover:bg-slate-800 flex items-center gap-1"
                    >
                        <HelpCircle className="w-3 h-3" /> Hilfe
                    </button>
                    <button
                        onClick={() => sendMessage("Weiter")}
                        className="px-2.5 py-1 bg-slate-900 border border-white/5 rounded-full text-[11px] text-gray-400 hover:text-white hover:bg-slate-800 flex items-center gap-1"
                    >
                        <ArrowRight className="w-3 h-3" /> Weiter
                    </button>
                    <button
                        onClick={() => sendMessage("Zurück")}
                        className="px-2.5 py-1 bg-slate-900 border border-white/5 rounded-full text-[11px] text-gray-400 hover:text-white hover:bg-slate-800 flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3 h-3" /> Zurück
                    </button>
                </div>
            </div>
        </div>
    );
}