import { useState, useRef, useEffect } from "react";
const MAX_ROUNDS = 10;

function StampOverlay({ verdict }) {
  if (!verdict) return null;
  const isPass = verdict === "pass";
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-8deg)",
        border: `6px solid ${isPass ? "#A9832E" : "#7A2530"}`,
        color: isPass ? "#A9832E" : "#7A2530",
        padding: "14px 28px",
        fontFamily: '"Courier New", monospace',
        fontWeight: 700,
        fontSize: "clamp(20px, 4vw, 34px)",
        letterSpacing: "3px",
        background: "rgba(22,20,15,0.85)",
        pointerEvents: "none",
        zIndex: 20,
        whiteSpace: "nowrap",
        boxShadow: `0 0 0 2px ${isPass ? "#A9832E" : "#7A2530"} inset`,
      }}
    >
      {isPass ? "CASE HOLDS" : "OBJECTION SUSTAINED"}
    </div>
  );
}

function Gauge({ value }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 11,
          letterSpacing: 1.5,
          color: "#A9832E",
        }}
      >
        CONVICTION
      </div>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 140,
          background: "#0F0D09",
          border: "1px solid #3A3324",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${clamped}%`,
            background:
              clamped >= 60
                ? "linear-gradient(180deg, #C9A34E, #A9832E)"
                : clamped >= 35
                ? "linear-gradient(180deg, #8A7038, #6B5528)"
                : "linear-gradient(180deg, #7A2530, #591B23)",
            transition: "height 0.6s ease",
          }}
        />
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            style={{
              position: "absolute",
              bottom: `${mark}%`,
              left: 0,
              right: 0,
              borderTop: "1px dashed #3A3324",
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 20,
          color: "#EDE3CF",
          textAlign: "center",
        }}
      >
        {clamped}
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("intake");
  const [ideaText, setIdeaText] = useState("");
  const [rebuttal, setRebuttal] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [round, setRound] = useState(0);
  const [conviction, setConviction] = useState(30);
  const [verdict, setVerdict] = useState(null);
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, loading]);

  async function callAdvocate(nextRound, history, latestUserText) {
    const response = await fetch("/api/advocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ideaText,
        round: nextRound,
        maxRounds: MAX_ROUNDS,
        history,
        latestUserText,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Request failed");
    }

    return response.json();
  }

  async function startCase() {
    if (!ideaText.trim()) return;
    setError(null);
    setLoading(true);
    setPhase("debating");
    try {
      const result = await callAdvocate(1, [], null);
      setTranscript([{ side: "advocate", text: result.objection }]);
      setConviction(result.conviction);
      setRound(1);
      if (result.verdict !== "debating") {
        setVerdict(result.verdict);
        setReasoning(result.reasoning);
        setPhase("done");
      }
    } catch (e) {
      setError("Something went wrong reaching the advocate. Try again.");
      setPhase("intake");
    } finally {
      setLoading(false);
    }
  }

  async function submitRebuttal() {
    if (!rebuttal.trim() || loading) return;
    const userText = rebuttal.trim();
    const newHistory = [...transcript, { side: "user", text: userText }];
    setTranscript(newHistory);
    setRebuttal("");
    setError(null);
    setLoading(true);
    try {
      const nextRound = round + 1;
      const result = await callAdvocate(nextRound, transcript, userText);
      setTranscript([...newHistory, { side: "advocate", text: result.objection || "" }]);
      setConviction(result.conviction);
      setRound(nextRound);
      if (result.verdict !== "debating") {
        setVerdict(result.verdict);
        setReasoning(result.reasoning);
        setPhase("done");
      }
    } catch (e) {
      setError("Something went wrong reaching the advocate. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhase("intake");
    setIdeaText("");
    setRebuttal("");
    setTranscript([]);
    setRound(0);
    setConviction(30);
    setVerdict(null);
    setReasoning("");
    setError(null);
  }

  const rootStyle = {
    background: "#16140F",
    color: "#EDE3CF",
    minHeight: "100vh",
    fontFamily: 'Georgia, "Iowan Old Style", serif',
    display: "flex",
    flexDirection: "column",
  };

  if (phase === "intake") {
    return (
      <div style={{ ...rootStyle, padding: "40px 24px", alignItems: "center" }}>
        <div style={{ maxWidth: 560, width: "100%" }}>
          <div
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 11,
              letterSpacing: 2,
              color: "#A9832E",
              marginBottom: 10,
            }}
          >
            CASE FILE NO. {Math.floor(Math.random() * 9000 + 1000)}
          </div>
          <h1
            style={{
              fontSize: 34,
              margin: "0 0 6px 0",
              fontWeight: 400,
              borderBottom: "2px solid #3A3324",
              paddingBottom: 16,
            }}
          >
            The Devil's Advocate
          </h1>
          <p style={{ color: "#B8AE95", fontSize: 15, lineHeight: 1.6, marginTop: 16 }}>
            State the idea, plan, or decision you want tested. It will be met
            with the strongest objection available — and only cleared once it
            has genuinely earned it.
          </p>
          <textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="e.g. I'm going to quit my job and build this full-time starting next month..."
            style={{
              width: "100%",
              minHeight: 120,
              marginTop: 20,
              background: "#EDE3CF",
              color: "#2B2620",
              border: "1px solid #3A3324",
              padding: 16,
              fontFamily: "inherit",
              fontSize: 15,
              lineHeight: 1.5,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ color: "#C97A7A", fontSize: 13, marginTop: 10 }}>{error}</div>
          )}
          <button
            onClick={startCase}
            disabled={!ideaText.trim() || loading}
            style={{
              marginTop: 18,
              background: ideaText.trim() ? "#7A2530" : "#3A3324",
              color: "#EDE3CF",
              border: "none",
              padding: "12px 28px",
              fontFamily: '"Courier New", monospace',
              fontSize: 13,
              letterSpacing: 1.5,
              cursor: ideaText.trim() ? "pointer" : "default",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "OPENING CASE..." : "PRESENT YOUR CASE"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...rootStyle }}>
      <div style={{ display: "flex", flex: 1, minHeight: "100vh" }}>
        <div
          style={{
            width: 180,
            flexShrink: 0,
            background: "#100E0A",
            borderRight: "1px solid #3A3324",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: 10,
                letterSpacing: 1.5,
                color: "#7A6F55",
              }}
            >
              ROUND
            </div>
            <div style={{ fontFamily: '"Courier New", monospace', fontSize: 24 }}>
              {round} / {MAX_ROUNDS}
            </div>
          </div>
          <Gauge value={conviction} />
          <div
            style={{
              fontSize: 12,
              color: "#7A6F55",
              lineHeight: 1.6,
              fontFamily: '"Courier New", monospace',
            }}
          >
            THE IDEA:
            <div style={{ color: "#B8AE95", marginTop: 6, fontFamily: "Georgia, serif", fontSize: 13 }}>
              {ideaText.length > 140 ? ideaText.slice(0, 140) + "…" : ideaText}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            minWidth: 0,
          }}
        >
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {(transcript || []).slice(-2).map((entry, i) => (
              <div
                key={entry.id || entry.text || i}
                style={{
                  alignSelf: entry.side === "user" ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: entry.side === "user" ? "#8A9A7A" : "#B06868",
                    marginBottom: 5,
                    textAlign: entry.side === "user" ? "right" : "left",
                  }}
                >
                  {entry.side === "user" ? "YOUR REBUTTAL" : "THE ADVOCATE"}
                </div>
                <div
                  style={{
                    background: entry.side === "user" ? "#EDE3CF" : "#241E17",
                    color: entry.side === "user" ? "#2B2620" : "#EDE3CF",
                    border:
                      entry.side === "user"
                        ? "1px solid #3A3324"
                        : "1px solid #4A2A2E",
                    padding: "14px 18px",
                    fontSize: 15,
                    lineHeight: 1.6,
                  }}
                >
                  {entry?.text || entry?.objection || entry?.content || ""}
                </div>
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  fontFamily: '"Courier New", monospace',
                  fontSize: 12,
                  color: "#7A6F55",
                  padding: "8px 0",
                }}
              >
                the advocate is considering...
              </div>
            )}
            {phase === "done" && (
              <div
                style={{
                  marginTop: 8,
                  padding: "16px 18px",
                  border: `1px solid ${verdict === "pass" ? "#A9832E" : "#7A2530"}`,
                  color: verdict === "pass" ? "#D9BC7E" : "#D98E8E",
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                {reasoning}
              </div>
            )}
          </div>

          {phase === "done" && <StampOverlay verdict={verdict} />}

          {phase === "debating" && (
            <div
              style={{
                borderTop: "1px solid #3A3324",
                padding: 16,
                display: "flex",
                gap: 10,
              }}
            >
              <input
                value={rebuttal}
                onChange={(e) => setRebuttal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitRebuttal()}
                placeholder="Defend your case..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#0F0D09",
                  border: "1px solid #3A3324",
                  color: "#EDE3CF",
                  padding: "12px 14px",
                  fontFamily: "Georgia, serif",
                  fontSize: 14,
                }}
              />
              <button
                onClick={submitRebuttal}
                disabled={!rebuttal.trim() || loading}
                style={{
                  background: "#7A2530",
                  color: "#EDE3CF",
                  border: "none",
                  padding: "0 22px",
                  fontFamily: '"Courier New", monospace',
                  fontSize: 12,
                  letterSpacing: 1,
                  cursor: "pointer",
                  opacity: rebuttal.trim() ? 1 : 0.5,
                }}
              >
                RESPOND
              </button>
            </div>
          )}

          {phase === "done" && (
            <div style={{ padding: 16, borderTop: "1px solid #3A3324" }}>
              <button
                onClick={reset}
                style={{
                  background: "#241E17",
                  color: "#EDE3CF",
                  border: "1px solid #3A3324",
                  padding: "10px 22px",
                  fontFamily: '"Courier New", monospace',
                  fontSize: 12,
                  letterSpacing: 1,
                  cursor: "pointer",
                }}
              >
                OPEN NEW CASE
                <div ref={chatEndRef} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
