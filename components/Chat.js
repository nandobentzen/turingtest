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
  const [userId, setUserId] = useState(null); // eslint-disable-line @typescript-eslint/no-unused-vars
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
      console.log("Connected userId:", socketRef.current.id); // Now it's explicitly used
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
    setShowGuessOptions(false);
    setGuessResult(null);
    setMessages([]);
    socketRef.current.emit("startChat");
  };

  const spinnerStyle = {
    margin: "20px auto",
    width: "50px",
    height: "50px",
    border: "5px solid #ccc",
    borderTop: "5px solid #128c7e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  return (
    <div
      className="chat-container"
      style={{
        maxWidth: "400px",
        margin: "auto",
        backgroundColor: "#e5ddd5",
        borderRadius: "10px",
        padding: "10px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {!hasStarted ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "20px" }}>
            CAN YOU GUESS WHO IS HUMAN AND WHO IS AI?
          </h1>
          <p style={{ marginBottom: "20px" }}>
            Chat for 60 seconds and then guess if your partner is a real person or a cleverly disguised AI.
          </p>
          <button
            onClick={startChat}
            style={{
              padding: "15px 30px",
              fontSize: "16px",
              borderRadius: "5px",
              backgroundColor: "#128c7e",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            START CHATTING
          </button>
        </div>
      ) : searching ? (
        <div style={{ textAlign: "center", fontSize: "18px", padding: "20px" }}>
          <div style={spinnerStyle}></div>
          <p>Searching for a match...</p>
        </div>
      ) : (
        <>
          <div
            style={{
              textAlign: "center",
              marginBottom: "10px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            Score: {score}
          </div>

          <div
            className="chat-box"
            ref={chatBoxRef}
            style={{
              height: "400px",
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: "10px",
              backgroundColor: "#fff",
              borderRadius: "5px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  maxWidth: "70%",
                  alignSelf: msg.user === "You" ? "flex-end" : "flex-start",
                  backgroundColor: msg.user === "You" ? "#dcf8c6" : "#fff",
                  padding: "10px",
                  borderRadius: "15px",
                  margin: "5px 0",
                  boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.1)",
                  wordWrap: "break-word",
                  textAlign: "left",
                }}
              >
                <strong>{msg.user}:</strong> {msg.text}
              </div>
            ))}
            <div ref={dummyRef}></div>
          </div>

          <p style={{ textAlign: "center", color: "#128c7e", marginTop: "10px" }}>
            Time Left: {timer}s
          </p>

          {!gameOver ? (
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                style={{
                  flexGrow: 1,
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
                placeholder="Type your message..."
              />
              <button onClick={sendMessage} style={{ padding: "10px", borderRadius: "5px", backgroundColor: "#25d366", color: "white", border: "none" }}>
                Send
              </button>
            </div>
) : showGuessOptions ? (

            <div style={{ textAlign: "center", marginTop: "10px" }}>

              <p style={{ marginBottom: "10px" }}>

                Who do you think your chat partner was?

              </p>

              {!guessResult ? (

                <>

                  <button

                    onClick={() => handleGuess("AI")}

                    style={{

                      padding: "10px",

                      margin: "5px",

                      borderRadius: "5px",

                      backgroundColor: "#34b7f1",

                      color: "white",

                      border: "none",

                    }}

                  >

                    AI

                  </button>

                  <button

                    onClick={() => handleGuess("Human")}

                    style={{

                      padding: "10px",

                      margin: "5px",

                      borderRadius: "5px",

                      backgroundColor: "#ff6f61",

                      color: "white",

                      border: "none",

                    }}

                  >

                    Human

                  </button>

                </>

              ) : (

                <>

                  <p style={{ marginTop: "10px", fontWeight: "bold" }}>

                    {guessResult}

                  </p>

                  <button

                    onClick={restartChat}

                    style={{

                      marginTop: "10px",

                      padding: "10px",

                      borderRadius: "5px",

                      backgroundColor: "#128c7e",

                      color: "white",

                      border: "none",

                    }}

                  >

                    Start a New Chat

                  </button>

                </>

              )}

            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
