/**
 * Vektra AI Co-Pilot API Client with Server-Sent Events (SSE) Streaming Support
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Retrieves the current authentication token from session/local storage.
 */
function getAuthToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

/**
 * Streams chat responses token-by-token from the Vektra Express Copilot Gateway.
 *
 * @param {Object} params
 * @param {string} params.message - The prompt or query from the user
 * @param {string} [params.sessionId] - Active conversation session ID
 * @param {Array} [params.history] - Recent message history
 * @param {Function} params.onToken - Callback fired when a new text token arrives
 * @param {Function} params.onCitations - Callback fired when citation metadata arrives
 * @param {Function} params.onEscalation - Callback fired if query auto-drafts HR escalation
 * @param {Function} params.onError - Callback fired on error
 * @param {Function} params.onDone - Callback fired when streaming finishes
 * @param {AbortSignal} [params.signal] - AbortSignal to cancel streaming
 */
export async function streamCopilotChat({
  message,
  sessionId,
  history = [],
  onToken,
  onCitations,
  onEscalation,
  onError,
  onDone,
  signal,
}) {
  const token = getAuthToken();
  if (!token) {
    onError?.(new Error("Authentication session expired. Please log in again."));
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/copilot/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        message,
        sessionId,
        history,
        stream: true,
      }),
      signal,
    });

    if (response.status === 401) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      onError?.(new Error("Your session has expired. Please sign in again."));
      return;
    }

    if (response.status === 403) {
      const errData = await response.json().catch(() => ({}));
      onError?.(
        new Error(
          errData.message || "Access Denied: You are not authorized for this query."
        )
      );
      return;
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      onError?.(
        new Error(
          errData.message || `Server responded with status ${response.status}`
        )
      );
      return;
    }

    const contentType = response.headers.get("content-type") || "";

    // Handle non-streaming JSON fallback response
    if (contentType.includes("application/json")) {
      const json = await response.json();
      const agentData = json.data || json;
      if (agentData.answer) onToken?.(agentData.answer);
      if (agentData.citations) onCitations?.(agentData.citations);
      if (agentData.escalation) onEscalation?.(agentData.escalation);
      onDone?.({
        citations: agentData.citations || [],
        escalation: agentData.escalation || null,
        sessionId: json.sessionId || sessionId,
      });
      return;
    }

    // Handle SSE Stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedCitations = [];
    let accumulatedEscalation = null;

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.replace(/^data:\s*/, "");
        try {
          const payload = JSON.parse(dataStr);

          if (payload.token) {
            onToken?.(payload.token);
          }

          if (payload.citations && payload.citations.length > 0) {
            accumulatedCitations = payload.citations;
            onCitations?.(payload.citations);
          }

          if (payload.escalation) {
            accumulatedEscalation = payload.escalation;
            onEscalation?.(payload.escalation);
          }

          if (payload.done) {
            onDone?.({
              citations: payload.citations || accumulatedCitations,
              escalation: payload.escalation || accumulatedEscalation,
              sessionId,
            });
          }
        } catch {
          // Skip partial or non-JSON SSE heartbeat lines
        }
      }
    }

    onDone?.({
      citations: accumulatedCitations,
      escalation: accumulatedEscalation,
      sessionId,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      onDone?.({ aborted: true });
      return;
    }
    console.error("[Copilot SSE Stream Error]:", err);
    onError?.(
      new Error(
        err.message || "Connection to Vektra AI Co-Pilot was interrupted."
      )
    );
  }
}

/**
 * Retrieves persisted conversation history for current user.
 */
export async function getCopilotConversations() {
  const token = getAuthToken();
  if (!token) return { success: false, data: [] };

  const res = await fetch(`${API_BASE_URL}/copilot/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load conversations: ${res.statusText}`);
  }

  return await res.json();
}
