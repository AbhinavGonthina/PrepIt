import { useState, useRef, useEffect } from "react";
import "./App.css";

const TIPS = [
  "Research the company's latest earnings call or press releases before your interview.",
  "Prepare a 60-second 'Tell me about yourself' that ends with why you want THIS role.",
  "Use the STAR method: Situation, Task, Action, Result for behavioral questions.",
  "Google interviewers love candidates who think out loud during coding problems.",
  "Always ask clarifying questions before diving into a solution.",
  "Have 3 strong projects ready with metrics — numbers make stories memorable.",
  "Know your resume cold — every line is fair game.",
  "Study the job description word-for-word and mirror their language back.",
  "Prepare 3 thoughtful questions to ask the interviewer at the end.",
  "Practice coding on a whiteboard or plain editor — no autocomplete.",
  "For system design, always start with requirements before drawing anything.",
  "A great answer addresses the 'so what' — always explain the impact.",
  "Interviewers remember how you made them feel, not just what you said.",
  "Google values 'Googleyness' — show curiosity, humility, and collaboration.",
  "Rehearse your answers out loud, not just in your head.",
  "Know Big-O for every data structure operation — time and space.",
  "Demonstrate enthusiasm for the company's specific products or mission.",
  "If you get stuck, narrate your thought process — silence is worse than thinking.",
  "Follow up with a thank-you email within 24 hours of your interview.",
  "Common system design topics: URL shortener, Twitter feed, rate limiter.",
  "Behavioral questions test culture fit as much as technical skills.",
  "Bring energy — interviewers make decisions in the first few minutes.",
  "Know the difference between a process and a thread before any SWE interview.",
  "Practice explaining complex ideas simply — communication is a skill they're testing.",
  "Confidence comes from preparation. The more you practice, the less you panic.",
];

const SECTION_CONFIG = {
  "COMPANY INTEL": {
    icon: "🏢",
    color: "#f0f7ff",
    border: "#bfdbfe",
    badge: "#3b82f6",
    accent: "#eff6ff",
    label: "Know Before You Go",
    listStyle: "cards",
  },
  "RESUME ALIGNMENT": {
    icon: "📋",
    color: "#f0fdf4",
    border: "#bbf7d0",
    badge: "#22c55e",
    accent: "#f0fdf4",
    label: "Strengths & Gaps",
    listStyle: "cards",
  },
  "LIKELY INTERVIEW QUESTIONS": {
    icon: "💬",
    color: "#fefce8",
    border: "#fde68a",
    badge: "#f59e0b",
    accent: "#fffbeb",
    label: "Prepare These",
    listStyle: "numbered",
  },
  "TALKING POINTS": {
    icon: "🎯",
    color: "#fdf4ff",
    border: "#e9d5ff",
    badge: "#a855f7",
    accent: "#faf5ff",
    label: "Highlight These",
    listStyle: "numbered",
  },
  "RED FLAGS": {
    icon: "🚩",
    color: "#fff1f2",
    border: "#fecdd3",
    badge: "#f43f5e",
    accent: "#fff1f2",
    label: "Address Proactively",
    listStyle: "twoCol",
  },
};

const getConfig = (title) => {
  const upper = title.toUpperCase();
  for (const key of Object.keys(SECTION_CONFIG)) {
    // Match on key words to avoid partial mismatches
    const keyWords = key.split(" ");
    if (keyWords.every((w) => upper.includes(w))) return SECTION_CONFIG[key];
  }
  return {
    icon: "📌",
    color: "#f8fafc",
    border: "#e2e8f0",
    badge: "#64748b",
    accent: "#f8fafc",
    label: "Notes",
    listStyle: "cards",
  };
};

const STEPS = [
  { icon: "🔍", text: "Searching company intel & recent news" },
  { icon: "📋", text: "Comparing your resume to the job description" },
  { icon: "💬", text: "Generating role-specific interview questions" },
  { icon: "✍️", text: "Compiling your personalized prep report" },
];

function App() {
  const [company, setCompany] = useState("");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumeMode, setResumeMode] = useState("text");
  const [pdfName, setPdfName] = useState("");
  const [currentTip, setCurrentTip] = useState(TIPS[0]);
  const [tipVisible, setTipVisible] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [collapsed, setCollapsed] = useState({});
  const fileRef = useRef();
  const tipInterval = useRef();
  const stepInterval = useRef();

  const toggleSection = (i) =>
    setCollapsed((prev) => ({ ...prev, [i]: !prev[i] }));

  const cleanBody = (text) =>
    text
      .replace(/potential concerns?:\s*/gi, "")
      .replace(/how to address:\s*/gi, "")
      .replace(/final advice:\s*/gi, "")
      .replace(/strengths?\/gaps?:\s*/gi, "")
      .replace(/gaps?\/weaknesses?:\s*/gi, "")
      .replace(/skills?\/experiences? that match:\s*/gi, "")
      .replace(/common .*?questions?:\s*/gi, "")
      .replace(/role-specific questions?:\s*/gi, "")
      .replace(/highlight these from your resume.*?:\s*/gi, "")
      .replace(/frame in terms.*?:\s*/gi, "")
      .trim();

  const sections = report
    ? report
        .split(/\n(?=\d+[\.\)]\s+[A-Z]{2,})/)
        .map((s) => {
          const lines = s.trim().split("\n");
          return {
            title: lines[0].trim(),
            body: lines.slice(1).join("\n").trim(),
          };
        })
        .filter((s) => /^\d+/.test(s.title) && s.body.length > 0)
    : [];

  useEffect(() => {
    if (loading) {
      const shuffled = [...TIPS].sort(() => Math.random() - 0.5);
      let i = 0;
      setCurrentTip(shuffled[0]);
      setTipVisible(true);
      setLoadingStep(0);

      tipInterval.current = setInterval(() => {
        setTipVisible(false);
        setTimeout(() => {
          i = (i + 1) % shuffled.length;
          setCurrentTip(shuffled[i]);
          setTipVisible(true);
        }, 500);
      }, 7500);

      stepInterval.current = setInterval(() => {
        setLoadingStep((s) => Math.min(s + 1, STEPS.length - 1));
      }, 6000);
    } else {
      clearInterval(tipInterval.current);
      clearInterval(stepInterval.current);
    }
    return () => {
      clearInterval(tipInterval.current);
      clearInterval(stepInterval.current);
    };
  }, [loading]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfName(file.name);
    if (file.type === "application/pdf") {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("http://127.0.0.1:5000/parse-pdf", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setResume(data.text || "");
      } catch {
        setError("Failed to parse PDF. Try pasting your resume as text.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setResume(ev.target.result);
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!company || !resume || !jobDescription) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setReport("");
    setCollapsed({});
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, resume, jobDescription }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value);
      }
      try {
        const parsed = JSON.parse(buffer);
        setReport(parsed.answer || buffer);
      } catch {
        const match = buffer.match(/"answer"\s*:\s*"([\s\S]*?)"\s*\}/);
        if (match)
          setReport(match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'));
        else setReport(buffer);
      }
    } catch {
      setError("Something went wrong. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-inner">
          <div className="nav-left">
            <img
              src="/PrepIt.png"
              alt="PrepIt"
              className="nav-logo-img"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="nav-logo" style={{ display: "none" }}>
              PrepIt
            </span>
            <span className="nav-divider" />
            <span className="nav-sub">AI Interview Preparation</span>
          </div>
          <div className="nav-right">
            <span className="nav-tag">Powered by Subconscious</span>
          </div>
        </div>
      </header>

      <div className="layout">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="scroll-hint">
            <span>Fill in all fields below</span>
            <span className="scroll-arrow">↓</span>
          </div>

          <div className="field-group">
            <label className="field-label">Company Name</label>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Google, Meta, Stripe..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Your Resume</label>
            <div className="toggle-row">
              <button
                className={`toggle-btn ${resumeMode === "text" ? "active" : ""}`}
                onClick={() => setResumeMode("text")}
              >
                Paste Text
              </button>
              <button
                className={`toggle-btn ${resumeMode === "pdf" ? "active" : ""}`}
                onClick={() => setResumeMode("pdf")}
              >
                Upload PDF
              </button>
            </div>
            {resumeMode === "text" ? (
              <textarea
                className="field-textarea"
                placeholder="Paste your full resume here..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                rows={10}
              />
            ) : (
              <div className="dropzone" onClick={() => fileRef.current.click()}>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
                {pdfName ? (
                  <div className="pdf-uploaded">
                    <span>📄 {pdfName}</span>
                    <span className="pdf-check">✓ Ready</span>
                  </div>
                ) : (
                  <div className="dropzone-inner">
                    <div className="upload-icon-circle">↑</div>
                    <p>Click to upload resume</p>
                    <span className="upload-hint">.pdf or .txt accepted</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="field-group">
            <label className="field-label">Job Description</label>
            <textarea
              className="field-textarea"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="btn-dots">
                  <span />
                  <span />
                  <span />
                </span>{" "}
                Analyzing...
              </span>
            ) : (
              "Generate Prep Report →"
            )}
          </button>

          <div className="checklist">
            <p className="checklist-title">Report includes</p>
            {Object.entries(SECTION_CONFIG).map(([key, val]) => (
              <div className="checklist-item" key={key}>
                <span
                  className="checklist-icon"
                  style={{
                    background: val.color,
                    border: `1px solid ${val.border}`,
                  }}
                >
                  {val.icon}
                </span>
                <span>{key.charAt(0) + key.slice(1).toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {!loading && !report && (
            <div className="empty-state">
              <div className="empty-graphic">
                {[60, 80, 50, 70, 40].map((w, i) => (
                  <div
                    key={i}
                    className="empty-line"
                    style={{ width: `${w}%`, animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <h3>Your report will appear here</h3>
              <p>
                Complete the form and click Generate to receive your
                personalized interview prep report.
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="loading-top">
                <div className="loading-bars">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="bar"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <div className="loading-info">
                  <p className="loading-title">
                    Preparing your report for <strong>{company}</strong>
                  </p>
                  <p className="loading-subtitle">
                    This takes about 30–60 seconds
                  </p>
                </div>
              </div>

              <div className="steps-track">
                {STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`step-item ${i <= loadingStep ? "step-active" : ""} ${i < loadingStep ? "step-done" : ""}`}
                  >
                    <div className="step-indicator">
                      {i < loadingStep ? (
                        <span className="step-check">✓</span>
                      ) : (
                        <span className="step-num">{i + 1}</span>
                      )}
                    </div>
                    <div className="step-content">
                      <span className="step-icon">{step.icon}</span>
                      <span className="step-text">{step.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`tip-card ${tipVisible ? "tip-in" : "tip-out"}`}>
                <div className="tip-header">
                  <span className="tip-pill">💡 Interview Tip</span>
                </div>
                <p className="tip-text">{currentTip}</p>
              </div>
            </div>
          )}

          {report && !loading && (
            <div className="report">
              <div className="report-header">
                <div>
                  <h2>Interview Prep Report</h2>
                  <p className="report-sub">
                    Personalized for your application to{" "}
                    <strong>{company}</strong>
                  </p>
                </div>
                <button className="report-reset" onClick={() => setReport("")}>
                  ← New Report
                </button>
              </div>

              <div className="sections-grid">
                {sections.length === 0 && (
                  <div
                    style={{
                      padding: 24,
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #ebebeb",
                    }}
                  >
                    <pre
                      style={{
                        fontSize: "0.8rem",
                        color: "#666",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {report}
                    </pre>
                  </div>
                )}
                {sections.map((s, i) => {
                  const cfg = getConfig(s.title);
                  const cleanTitle = s.title.replace(/^\d+\.\s*/, "");
                  const cleaned = cleanBody(s.body);
                  const lines = cleaned.split("\n").filter((l) => l.trim());
                  const bullets = lines.filter((l) => /^[-–•]/.test(l.trim()));
                  const paras = lines.filter((l) => !/^[-–•]/.test(l.trim()));
                  const isCollapsed = collapsed[i];

                  return (
                    <div
                      className="section"
                      key={i}
                      style={{
                        "--sec-bg": cfg.color,
                        "--sec-border": cfg.border,
                        "--sec-badge": cfg.badge,
                        "--sec-accent": cfg.accent,
                      }}
                    >
                      {/* Header */}
                      <div
                        className="section-head"
                        onClick={() => toggleSection(i)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="section-icon-wrap">
                          <span className="section-emoji">{cfg.icon}</span>
                        </div>
                        <div className="section-meta">
                          <span className="section-label">{cfg.label}</span>
                          <h3 className="section-title">{cleanTitle}</h3>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span className="section-num-badge">0{i + 1}</span>
                          <span
                            className="collapse-chevron"
                            style={{
                              transform: isCollapsed
                                ? "rotate(-90deg)"
                                : "rotate(0deg)",
                            }}
                          >
                            ↓
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      {!isCollapsed && (
                        <div className="section-body-wrap">
                          {paras.length > 0 &&
                            cfg.listStyle !== "twoCol" &&
                            cfg.listStyle !== "numbered" && (
                              <p className="section-para">{paras.join(" ")}</p>
                            )}

                          {bullets.length > 0 && cfg.listStyle === "cards" && (
                            <div className="bullet-list">
                              {bullets.map((b, j) => (
                                <div className="bullet-item" key={j}>
                                  <span
                                    className="bullet-dot"
                                    style={{ background: cfg.badge }}
                                  />
                                  <span>{b.replace(/^[-–•]\s*/, "")}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {cfg.listStyle === "numbered" && (
                            <div className="numbered-list">
                              {(bullets.length > 0 ? bullets : paras).map(
                                (b, j) => (
                                  <div className="numbered-item" key={j}>
                                    <span
                                      className="numbered-index"
                                      style={{
                                        color: cfg.badge,
                                        borderColor: cfg.border,
                                      }}
                                    >
                                      {j + 1}
                                    </span>
                                    <span>{b.replace(/^[-–•\d.]\s*/, "")}</span>
                                  </div>
                                ),
                              )}
                            </div>
                          )}

                          {cfg.listStyle === "twoCol" &&
                            (() => {
                              // Try bullets first, fall back to splitting prose into sentences
                              const items =
                                bullets.length > 0
                                  ? bullets.map((b) =>
                                      b.replace(/^[-–•]\s*/, ""),
                                    )
                                  : cleaned
                                      .split(/(?<=[.!?])\s+/)
                                      .filter((s) => s.trim().length > 10);
                              const half = Math.ceil(items.length / 2);
                              const concerns = items.slice(0, half);
                              const addresses = items.slice(half);
                              return (
                                <div className="twocol-wrap">
                                  <div className="twocol-group">
                                    <p
                                      className="twocol-label"
                                      style={{ color: cfg.badge }}
                                    >
                                      ⚠ Concerns
                                    </p>
                                    {concerns.map((b, j) => (
                                      <div
                                        className="twocol-item concern"
                                        key={j}
                                      >
                                        {b}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="twocol-group">
                                    <p
                                      className="twocol-label"
                                      style={{ color: "#16a34a" }}
                                    >
                                      ✓ How to Address
                                    </p>
                                    {addresses.length > 0 ? (
                                      addresses.map((b, j) => (
                                        <div
                                          className="twocol-item address"
                                          key={j}
                                        >
                                          {b}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="twocol-item address">
                                        Emphasize adaptability, strong CS
                                        fundamentals, and eagerness to learn on
                                        the job.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                          {/* Fallback: show raw body if nothing parsed */}
                          {bullets.length === 0 &&
                            paras.length === 0 &&
                            s.body && <p className="section-para">{s.body}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
