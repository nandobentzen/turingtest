"use client";

import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import styles from "./Chat.module.css"; // Import the CSS module

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [timer, setTimer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [room, setRoom] = useState(null);
  const [searching, setSearching] = useState(false);
  const [partnerType, setPartnerType] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [score, setScore] = useState(0);
  const chatBoxRef = useRef(null);
  const dummyRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to your Heroku server URL.
    socketRef.current = io("https://turinggame-026947442f58.herokuapp.com/");

    socketRef.current.on("connect", () => {
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

  const handleGuess = (guess) => {
    if (guessResult) return;
    if (
      (guess === "AI" && partnerType === "ai") ||
      (guess === "Human" && partnerType === "human")
    ) {
      setGuessResult("Correct! You got it right.");
      setScore((prev) => prev + 1);
    } else {
      setGuessResult("Wrong! Better luck next time.");
      setScore(0);
    }
  };

  const restartChat = () => {
    setSearching(true);
    setGameOver(false);
    setRoom(null);
    setPartnerType(null);
    setGuessResult(null);
    setMessages([]);
    socketRef.current.emit("startChat");
  };

  return (
    <div className={styles.chatContainer}>
      {!hasStarted ? (
        <div className={styles.startScreen}>
	<h2>PlayTuring.com</h2>
          <h1>CAN YOU GUESS WHO IS HUMAN AND WHO IS AI?</h1>
          <p>
            Chat for 60 seconds and then guess if your partner is a real person or a cleverly disguised AI.
          </p>
          <button className={styles.startButton} onClick={startChat}>
            START CHATTING
          </button>
        </div>
      ) : searching ? (
        <div className={styles.searchingScreen}>
          <div className={styles.spinner}></div>
          <p>Searching for a match...</p>
        </div>
      ) : (
        <>
          <div className={styles.score}>Score: {score}</div>

          <div className={styles.chatBox} ref={chatBoxRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  msg.user === "You" ? styles.you : styles.guest
                }`}
              >
                <strong>{msg.user}:</strong> {msg.text}
              </div>
            ))}
            <div ref={dummyRef}></div>
          </div>

          <p className={styles.timer}>Time Left: {timer}s</p>

          {!gameOver ? (
            <div className={styles.inputContainer}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          ) : (
            <div className={styles.guessContainer}>
              <p>Who do you think your chat partner was?</p>
              {!guessResult ? (
                <>
                  <button className={styles.aiButton} onClick={() => handleGuess("AI")}>
                    AI
                  </button>
                  <button className={styles.humanButton} onClick={() => handleGuess("Human")}>
                    Human
                  </button>
                </>
              ) : (
                <>
                  <p>{guessResult}</p>
                  <button className={styles.newChatButton} onClick={restartChat}>
                    Start a New Chat
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
