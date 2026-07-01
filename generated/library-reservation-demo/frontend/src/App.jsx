import { useEffect, useState } from "react";

const initialMessage = "도서관 스터디룸 예약하고 싶어요";
const fieldLabels = {
  "patron_display_name": "이용자",
  "reservation_id": "예약 번호",
  "resource_label": "리소스",
  "time_window": "시간",
  "reservation_status": "상태",
  "loan_titles": "대출 도서",
  "policy_summary": "정책 요약"
};
const publicFieldKeys = Object.keys(fieldLabels);

export default function App() {
  const [input, setInput] = useState(initialMessage);
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({ public_context: {}, resources: [], events: [] });
  const [activeAgent, setActiveAgent] = useState("triage_agent");
  const [guardrail, setGuardrail] = useState(null);
  const [loading, setLoading] = useState(false);

  const publicContextEntries = publicFieldKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(state.public_context || {}, key))
    .map((key) => [key, state.public_context[key]]);
  const loanTitles = Array.isArray(state.public_context?.loan_titles) ? state.public_context.loan_titles : [];

  useEffect(() => {
    let alive = true;
    fetch("/state/bootstrap")
      .then((response) => response.json())
      .then((data) => {
        if (alive) {
          setState(data);
          setActiveAgent(data.agents?.[0] || "triage_agent");
        }
      })
      .catch(() => setGuardrail({ reason: "초기 상태를 불러오지 못했습니다." }));
    return () => {
      alive = false;
    };
  }, []);

  async function sendMessage() {
    const message = input.trim();
    if (!message || loading) {
      return;
    }
    setLoading(true);
    setGuardrail(null);
    setMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thread_id: "demo", message }),
      });
      const data = await response.json();
      setActiveAgent(data.active_agent || "triage_agent");
      setState((current) => ({
        ...current,
        public_context: data.public_context || current.public_context,
        events: [...(current.events || []), ...(data.events || [])],
      }));
      setMessages((current) => [...current, { role: "assistant", content: data.assistant_message }]);
      setInput("");
      if (data.status === "blocked") {
        setGuardrail(data.guardrail);
      }
    } catch (error) {
      setGuardrail({ reason: "요청 처리 중 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="chat-panel" aria-label="고객 채팅">
        <header>
          <p className="eyebrow">library</p>
          <h1>도서관 예약 도우미</h1>
          <p className="screen-label">채팅으로 예약 요청을 처리하고 공개 상태만 확인합니다.</p>
        </header>
        <div className="messages" data-testid="chat-messages">
          {messages.length === 0 ? (
            <p className="empty">첫 요청을 입력하면 담당 에이전트와 공개 컨텍스트가 갱신됩니다.</p>
          ) : (
            messages.map((message, index) => (
              <article className={`message ${message.role}`} key={index}>
                <span>{message.role === "user" ? "사용자" : "도우미"}</span>
                <p>{message.content}</p>
              </article>
            ))
          )}
        </div>
        <div className="composer">
          <textarea
            data-testid="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                sendMessage();
              }
            }}
            rows={3}
            aria-label="채팅 메시지"
          />
          <button data-testid="send-message" onClick={sendMessage} disabled={loading}>
            {loading ? "처리 중" : "보내기"}
          </button>
        </div>
        <div data-testid="guardrail-banner" className={guardrail ? "guardrail visible" : "guardrail"}>
          {guardrail ? guardrail.reason : "가드레일 대기 상태"}
        </div>
      </section>

      <aside className="ops-panel">
        <section data-testid="agent-activity" className="panel-section">
          <h2>에이전트 활동</h2>
          <p className="panel-kicker">현재 담당</p>
          <p className="active-agent">{activeAgent}</p>
          <ul>
            {(state.events || []).slice(-6).map((event, index) => (
              <li key={`${event.type}-${index}`}>
                <span>{event.type}</span>
                <p>{event.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section data-testid="public-context" className="panel-section">
          <h2>공개 컨텍스트</h2>
          <dl>
            {publicContextEntries.map(([key, value]) => (
              <div key={key}>
                <dt>{fieldLabels[key] || key}</dt>
                <dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section data-testid="domain-widget" className="panel-section widget">
          <h2>스터디룸 시간 선택</h2>
          {(state.resources || []).length === 0 ? (
            <p>예약 가능한 공간을 확인 중입니다.</p>
          ) : (
            <div className="resource-grid">
              {state.resources.map((resource) => (
                <article key={resource.label}>
                  <strong>{resource.label}</strong>
                  <span>{resource.status}</span>
                  <p>{resource.detail}</p>
                </article>
              ))}
            </div>
          )}
          <div className="book-widget" aria-label="대출 도서">
            <h3>대출 도서</h3>
            {loanTitles.length === 0 ? (
              <p>공개 가능한 대출 도서가 없습니다.</p>
            ) : (
              <ul>
                {loanTitles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </aside>
    </main>
  );
}
