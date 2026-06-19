import { useState } from "react";

const GEMINI_API_KEY = 

async function gradeSQLWithAI(userAnswer) {
  const prompt = `
    You are an automated technical interview autograder for a SQL platform.
    Your job is to grade a user's SQL submission for the following problem:

    Problem: Find the second highest salary from the Employee table.
    If there is no second highest salary, return NULL.

    Expected Table Schema:
    - Table Name: Employee
    - Column: salary

    User's Submitted SQL Query:
    """${userAnswer}"""

    Grading Rubric Criteria:
    1. SYNTAX & STRUCTURE: Does the query have valid SQL syntax? Does it actually include the correct table name ('Employee') and column ('salary')? If it is missing the FROM clause or table name, the score MUST be 0.
    2. LOGIC (LIMIT/OFFSET): Does it correctly isolate the second record?
    3. EDGE CASES (DISTINCT): Does it include DISTINCT to handle duplicate highest values? If missing, cap the maximum score at 2.

    You must output your response in raw JSON format matching this schema exactly:
    {
        "passed": true/false,
        "score": integer (0 to 5),
        "status": "Accepted" or "Wrong Answer" or "Partial Credit" or "Syntax Error",
        "feedback": "Detailed, specific feedback explaining why they lost points or why it passed."
    }
  `;

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" + GEMINI_API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.0,
      },
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

function Badge({ status }) {
  const colors = {
    Accepted: { bg: "#d4edda", color: "#155724", border: "#c3e6cb" },
    "Partial Credit": { bg: "#fff3cd", color: "#856404", border: "#ffeeba" },
    "Wrong Answer": { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" },
    "Syntax Error": { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" },
    "Grader Error": { bg: "#e2e3e5", color: "#383d41", border: "#d6d8db" },
  };
  const s = colors[status] || colors["Grader Error"];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "4px 14px", borderRadius: "20px", fontWeight: 600, fontSize: "0.9rem"
    }}>
      {status}
    </span>
  );
}

function ScoreCircle({ score, max = 5 }) {
  const pct = (score / max) * 100;
  const color = pct === 100 ? "#28a745" : pct >= 50 ? "#ffc107" : "#dc3545";
  return (
    <div style={{ textAlign: "center", margin: "10px 0" }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r="38" fill="none" stroke="#e0e0e0" strokeWidth="8" />
        <circle cx="45" cy="45" r="38" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 38}`}
          strokeDashoffset={`${2 * Math.PI * 38 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)" />
        <text x="45" y="50" textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>
          {score}/{max}
        </text>
      </svg>
      <div style={{ color, fontWeight: 600, fontSize: "0.85rem" }}>Score</div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!query.trim()) { setError("Please enter a SQL query."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await gradeSQLWithAI(query);
      setResult(res);
    } catch (e) {
      setError("Failed to connect to grader: " + e.message);
    }
    setLoading(false);
  };

  const handleClear = () => { setQuery(""); setResult(null); setError(""); };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #e8d5f5 0%, #d4b8f0 50%, #c9a8eb 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif", padding: "20px"
    }}>
      <div style={{
        background: "white", borderRadius: "20px", padding: "40px",
        width: "100%", maxWidth: "700px",
        boxShadow: "0 20px 60px rgba(139, 90, 180, 0.2)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🧠</div>
          <h1 style={{ margin: 0, color: "#6a1b9a", fontSize: "1.6rem", fontWeight: 700 }}>
            SQL Autograder
          </h1>
          <p style={{ color: "#888", marginTop: "6px", fontSize: "0.95rem" }}>
            Powered by Gemini AI
          </p>
        </div>

        {/* Problem Statement */}
        <div style={{
          background: "#f3e5f5", border: "1px solid #ce93d8",
          borderRadius: "12px", padding: "16px", marginBottom: "24px"
        }}>
          <div style={{ fontWeight: 600, color: "#6a1b9a", marginBottom: "6px" }}>📋 Problem</div>
          <div style={{ color: "#4a148c", fontSize: "0.95rem" }}>
            Find the <strong>second highest salary</strong> from the <code style={{
              background: "#e1bee7", padding: "1px 6px", borderRadius: "4px"
            }}>Employee</code> table.
            If there is no second highest salary, return <code style={{
              background: "#e1bee7", padding: "1px 6px", borderRadius: "4px"
            }}>NULL</code>.
          </div>
          <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "#7b1fa2" }}>
            <strong>Schema:</strong> Employee(<u>salary</u>)
          </div>
        </div>

        {/* SQL Input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: 600, color: "#6a1b9a", display: "block", marginBottom: "8px" }}>
            ✍️ Your SQL Query
          </label>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="SELECT ..."
            rows={5}
            style={{
              width: "100%", padding: "14px", borderRadius: "10px",
              border: "2px solid #ce93d8", fontSize: "0.95rem",
              fontFamily: "'Courier New', monospace", resize: "vertical",
              outline: "none", boxSizing: "border-box", background: "#fafafa",
              transition: "border 0.2s"
            }}
            onFocus={e => e.target.style.border = "2px solid #8e24aa"}
            onBlur={e => e.target.style.border = "2px solid #ce93d8"}
          />
        </div>

        {error && (
          <div style={{
            background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.9rem"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1, padding: "13px", borderRadius: "10px", border: "none",
              background: loading ? "#ce93d8" : "linear-gradient(135deg, #8e24aa, #6a1b9a)",
              color: "white", fontWeight: 700, fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s"
            }}
          >
            {loading ? "⏳ Grading..." : "🚀 Submit & Grade"}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: "13px 20px", borderRadius: "10px",
              border: "2px solid #ce93d8", background: "white",
              color: "#8e24aa", fontWeight: 600, cursor: "pointer", fontSize: "1rem"
            }}
          >
            🗑️ Clear
          </button>
        </div>

        {/* Result Card */}
        {result && (
          <div style={{
            border: "2px solid #ce93d8", borderRadius: "14px",
            padding: "24px", background: "#fdf6ff",
            animation: "fadeIn 0.4s ease"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px"
            }}>
              <div style={{ fontWeight: 700, color: "#6a1b9a", fontSize: "1.1rem" }}>
                📊 Grading Result
              </div>
              <Badge status={result.status} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "16px" }}>
              <ScoreCircle score={result.score} max={5} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#4a148c", marginBottom: "4px" }}>Verdict</div>
                <div style={{
                  fontSize: "1.2rem", fontWeight: 700,
                  color: result.passed ? "#28a745" : "#dc3545"
                }}>
                  {result.passed ? "✅ Passed" : "❌ Not Passed"}
                </div>
              </div>
            </div>

            <div style={{
              background: "white", borderRadius: "10px", padding: "14px",
              border: "1px solid #e1bee7"
            }}>
              <div style={{ fontWeight: 600, color: "#6a1b9a", marginBottom: "8px" }}>
                💬 Feedback
              </div>
              <div style={{ color: "#333", fontSize: "0.92rem", lineHeight: "1.6" }}>
                {result.feedback}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        textarea:focus { outline: none; }
        button:hover:not(:disabled) { opacity: 0.9; }
      `}</style>
    </div>
  );
}