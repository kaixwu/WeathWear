import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useData } from "../DataContext";
import "./AIChatbot.css";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", text: "Hi! I am SunWise, your AI travel assistant. Where do you want to go today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); 
  const [suggestions, setSuggestions] = useState([
    "🗺️ Plan a 1-day itinerary", 
    "☕ Best cafes nearby", 
    "🏛️ Top tourist spots"
  ]);
  const messagesEndRef = useRef(null);
  const { city, weather, currentCoords } = useData();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (displayMessage, apiQuery) => {
    if (loading) return;
    
    setMessages(prev => [...prev, { role: "user", text: displayMessage }]);
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await axios.post("/api/ai-chat", {
        message: apiQuery,
        history: history,
        location: city || "Philippines",
        weather: weather || null,
        lat: currentCoords?.lat || null,
        lon: currentCoords?.lon || null
      });

      if (res.data.text) {
        setHistory(res.data.history);
        
        if (res.data.bubbles && res.data.bubbles.length > 0) {
          setMessages(prev => [...prev, { role: "model", text: res.data.bubbles[0] }]);
          res.data.bubbles.slice(1).forEach((bubbleText, index) => {
            setTimeout(() => {
              setMessages(prev => [...prev, { role: "model", text: bubbleText }]);
            }, (index + 1) * 800);
          });
        } else {
          setMessages(prev => [...prev, { role: "model", text: res.data.text }]);
        }

        if (res.data.suggestions && res.data.suggestions.length > 0) {
          setSuggestions(res.data.suggestions);
        } else {
          setSuggestions(["🗺️ Plan a 1-day itinerary", "☕ Best cafes nearby", "🏛️ Top tourist spots"]);
        }
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      setMessages(prev => [...prev, { role: "model", text: "Sorry, I am having trouble connecting to my servers right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    sendMessage(msg, msg);
  };

  const handleSuggestionClick = (suggestionText) => {
    const cleanedQuery = suggestionText.replace(/^[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
    sendMessage(suggestionText, cleanedQuery);
  };

  return (
    <div className="chatbot-wrapper">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3 className="chatbot-title">
              <Sparkles size={18} color="var(--accent-teal)" />
              SunWise AI
            </h3>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role === "user" ? "user" : "ai"}`}>
                {msg.role === "model" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {loading && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {suggestions.length > 0 && !loading && (
            <div className="chatbot-suggestions">
              {suggestions.map((sug, idx) => (
                <button 
                  key={idx} 
                  className="chatbot-suggestion-chip"
                  onClick={() => handleSuggestionClick(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          <div className="chatbot-input-area">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />
            <button 
              className="chatbot-send-btn" 
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
}
