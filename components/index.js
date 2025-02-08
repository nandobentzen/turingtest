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

  // --- FAKE ONLINE PLAYERS STATE ---
  const [onlinePlayers, setOnlinePlayers] = useState(() => {
    // Start with random number between 49 and 89
    return Math.floor(Math.random() * (89 - 49 + 1)) + 49;
  });

  const chatBoxRef = useRef(null);
  const dummyRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // INTERVAL: Update the fake onlinePlayers every few seconds
    const interval = setInterval(() => {
      setOnlinePlayers((prev) => {
        // Randomly go up or down by 1
        const change = Math.random() < 0.5 ? -1 : 1;
        let newVal = prev + change;

        // Clamp between 49 and 89
        if (newVal < 49) newVal = 49;
        if (newVal > 89) newVal = 89;

        return newVal;
      });
    }, 3000); // every 3 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Connect to your Heroku server URL.
    socketRef.current = io("https://turinggame-026947442f58.herokuapp.com/");

    socketRef.current.on("connect", () => {
      console.log("Connected userId:", socketRef.current.id);
    });

    // When matched, we get the room and partnerType
    socketRef.current.on("matched", ({ room, partnerType }) => {
      setRoom(room);
      setPartnerType(partnerType);
      setSearching(false);
      setMessages([]);
    });

    // When a message arrives, figure out if it's "You" or "Guest"
    socketRef.current.on("message", (message) => {
      const sender = message.user === socketRef.current.id ? "You" : "Guest";
      setMessages((prev) => [...prev, { user: sender, text: message.text }]);
    });

    // Timer
    socketRef.current.on("timer", (timeLeft) => {
      setTimer(timeLeft);
    });

    // Game Over
    socketRef.current.on("gameOver", () => {
      setGameOver(true);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current.off("matched");
      socketRef.current.off("message");
      socketRef.current.off("timer");
      socketRef.current.off("gameOver");
      socketRef.current.disconnect();
    };
  }, []);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (dummyRef.current) {
      dummyRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Start chatting => request a match from server
  const startChat = () => {
    setHasStarted(true);
    setSearching(true);
    socketRef.current.emit("startChat");
  };

  // Send typed message to server
  const sendMessage = () => {
    if (input.trim() !== "" && room) {
      socketRef.current.emit("message", { room, text: input });
      setInput("");
    }
  };

  // User guesses "AI" or "Human"
  const handleGuess = (guess) => {
    if (guessResult) return; // Already guessed

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

  // Restart => search for a new match
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
    <div className={styles.pageBackground}>
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
            <div className={styles.score}>Your score: {score}</div>

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
                <b>Who do you think your chat partner was?</b>
                <small style={{ display: "block", margin: "5px 0 7px" }}>
                  A wrong guess resets your score.
                </small>
                {!guessResult ? (
                  <>
                    <button
                      className={styles.aiButton}
                      onClick={() => handleGuess("AI")}
                    >
                      AI
                    </button>
                    <button
                      className={styles.humanButton}
                      onClick={() => handleGuess("Human")}
                    >
                      Human
                    </button>
                  </>
                ) : (
                  <>
                    <p>{guessResult}</p>
                    <button
                      className={styles.newChatButton}
                      onClick={restartChat}
                    >
                      Start a New Chat
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      {/* Show the fake 'Online Players' at top */}
        <p style={{ textAlign: "center", color: "#333", marginBottom: "10px" }}>
          Online Players: {onlinePlayers}
        </p>
      </div>
    </div>
  );
}
