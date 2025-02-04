"use client";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [timer, setTimer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [room, setRoom] = useState(null);
  const [searching, setSearching] = useState(false);
  const [userId, setUserId] = useState(null);
  const [partnerType, setPartnerType] = useState(null);
  const [showGuessOptions, setShowGuessOptions] = useState(false);
  const [guessResult, setGuessResult] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [score, setScore] = useState(0);
  const chatBoxRef = useRef(null);
  const dummyRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("https://turinggame-026947442f58.herokuapp.com/");

    socketRef.current.on("connect", () => {
      setUserId(socketRef.current.id);
      console.log("Connected userId:", socketRef.current.id);
    });

    socketRef.current.on("matched", ({ room, partnerType }) => {
      setRoom(room);
      setPartnerType(partnerType);
      setSearching(false);
      setMessages([]);
    });

    socketRef.current.on("message", (message) => {
      const sender = message.user === socketRef.current.id ? "You" : "Guest";
      setMessages((prev) => [...prev, { user: sender, text: message.text }]);
    });

    socketRef.current.on("timer", (timeLeft) => {
      setTimer(timeLeft);
    });

    socketRef.current.on("gameOver", () => {
      setGameOver(true);
      setShowGuessOptions(true);
    });

    return () => {
      socketRef.current.off("matched");
      socketRef.current.off("message");
      socketRef.current.off("timer");
      socketRef.current.off("gameOver");
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (dummyRef.current) {
      dummyRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const startChat = () => {
    setHasStarted(true);
    setSearching(true);
    socketRef.current.emit("startChat");
  };

  const sendMessage = () => {
    if (input.trim() !== "" && room) {
      socketRef.current.emit("message", { room, text: input });
      setInput("");
    }
  };

  return (
    <div className="chat-container">
      {!hasStarted ? (
        <div className="start-screen">
          <h1>CAN YOU GUESS WHO IS HUMAN AND WHO IS AI?</h1>
          <p>Chat for 60 seconds and then guess if your partner is a real person or a cleverly disguised AI.</p>
          <button onClick={startChat}>START CHATTING</button>
        </div>
      ) : searching ? (
        <div className="spinner"></div>
      ) : (
        <>
          <div className="score">Score: {score}</div>

          <div className="chat-box" ref={chatBoxRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.user === "You" ? "you" : "guest"}`}>
                <strong>{msg.user}:</strong> {msg.text}
              </div>
            ))}
            <div ref={dummyRef}></div>
          </div>

          <p className="timer">Time Left: {timer}s</p>

          {!gameOver ? (
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          ) : showGuessOptions ? (
            <div className="guess-container">
              <p>Who do you think your chat partner was?</p>
              {!guessResult ? (
                <>
                  <button onClick={() => handleGuess("AI")}>AI</button>
                  <button onClick={() => handleGuess("Human")}>Human</button>
                </>
              ) : (
                <>
                  <p>{guessResult}</p>
                  <button onClick={restartChat}>Start a New Chat</button>
                </>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
