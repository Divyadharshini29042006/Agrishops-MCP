import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { IoClose, IoChatbubbleEllipses, IoSend, IoVolumeHigh, IoMic, IoExpand, IoContract } from 'react-icons/io5';
import './Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [language, setLanguage] = useState('en'); // 'en' or 'ta'
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { role: 'bot', text: "Hello! 👋 I'm your agricultural assistant. How can I help you today?", lang: 'en' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    // Speech Recognition Setup
    const startRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setMessage(transcript);
            // Optionally auto-send:
            // handleSendMessage(null, transcript);
        };

        recognition.start();
    };

    const speak = (text, langCode = language) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any current speaking
            const utterance = new SpeechSynthesisUtterance(text);

            // Try to find a voice for the specific language
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = null;

            if (langCode === 'ta') {
                selectedVoice = voices.find(voice => voice.lang.includes('ta'));
            } else {
                selectedVoice = voices.find(voice => voice.lang.includes('en'));
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            utterance.lang = langCode === 'ta' ? 'ta-IN' : 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSendMessage = async (e, overrideMessage = null) => {
        if (e) e.preventDefault();
        const textToSend = overrideMessage || message;
        if (!textToSend.trim()) return;

        const userMessage = { role: 'user', text: textToSend };
        setChatHistory(prev => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/chatbot/message',
                { message: userMessage.text, language: language },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            );

            const botReply = { role: 'bot', text: response.data.message, lang: language };
            setChatHistory(prev => [...prev, botReply]);
            speak(response.data.message, language);
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMsg = language === 'ta'
                ? "மன்னிக்கவும், சேவையகத்துடன் இணைப்பதில் எனக்கு சிக்கல் உள்ளது. பின்னர் மீண்டும் முயற்சிக்கவும்."
                : "Sorry, I'm having trouble connecting to the server. Please try again later.";
            const errorReply = { role: 'bot', text: errorMsg, lang: language };
            setChatHistory(prev => [...prev, errorReply]);
        } finally {
            setIsLoading(false);
        }
    };

    // Force load voices for Chrome
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ta' : 'en';
        setLanguage(newLang);
        const welcome = newLang === 'ta'
            ? "வணக்கம்! 👋 நான் உங்கள் விவசாய உதவியாளர். நான் உங்களுக்கு எப்படி உதவ முடியும்?"
            : "Hello! 👋 I'm your agricultural assistant. How can I help you today?";
        setChatHistory([{ role: 'bot', text: welcome, lang: newLang }]);
        speak(welcome, newLang);
    };

    return (
        <div className="chatbot-container">
            {!isOpen && (
                <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
                    <IoChatbubbleEllipses size={30} />
                </button>
            )}

            {isOpen && (
                <div className={`chat-window ${isMaximized ? 'maximized' : ''}`}>
                    <div className="chat-header">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold">Agri-Chatbot</h3>
                            <button
                                className={`lang-toggle ${language === 'ta' ? 'active' : ''}`}
                                onClick={toggleLanguage}
                            >
                                {language === 'en' ? 'ENGLISH' : 'தமிழ்'}
                            </button>
                        </div>
                        <div className="chat-header-actions">
                            <button className="size-toggle-btn" onClick={() => setIsMaximized(!isMaximized)}>
                                {isMaximized ? <IoContract size={20} /> : <IoExpand size={20} />}
                            </button>
                            <button className="close-btn" onClick={() => setIsOpen(false)}>
                                <IoClose size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`message-bubble ${msg.role}`}>
                                <p>{msg.text}</p>
                                {msg.role === 'bot' && (
                                    <button className="speak-btn" onClick={() => speak(msg.text, msg.lang || language)}>
                                        <IoVolumeHigh size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {isLoading && <div className="message-bubble bot typing">Thinking...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <button
                            type="button"
                            className={`mic-btn ${isRecording ? 'recording' : ''}`}
                            onClick={startRecording}
                            disabled={isLoading}
                        >
                            <IoMic size={22} />
                        </button>
                        <input
                            type="text"
                            placeholder={language === 'ta' ? "ஏதாவது கேளுங்கள்..." : "Ask me something..."}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading}>
                            <IoSend size={20} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
