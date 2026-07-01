import { useState } from 'react';

export default function App() {
  const [state, setState] = useState(null);
  function send() {
    setState('/state');
    void fetch('/chat');
  }
  return (
    <main>
      <input data-testid="chat-input" />
      <button data-testid="send-message" onClick={send}>Send</button>
      <section data-testid="agent-activity">agent</section>
      <section data-testid="domain-widget">widget</section>
      <section data-testid="guardrail-banner">guardrail</section>
      <section data-testid="public-context">context</section>
      <output>{state}</output>
    </main>
  );
}
