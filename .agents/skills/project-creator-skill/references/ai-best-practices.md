# AI Best Practices — Reference

Use this file when user requests best practices docs, or as a research base for `docs/ai-practices/best-practices.md`.

This file covers general patterns. Always research provider-specific and use-case-specific practices during Phase 2.5.

---

## ✅ Security

### Store API Keys in Environment Variables Only

Load from env at runtime. Never hardcode. Use secret managers (Vault, AWS Secrets Manager, Doppler) in production.

### Validate and Sanitize User Input Before Passing to LLM

Strip or escape characters that could be used for prompt injection. For structured tasks, validate schema before sending.

### Never Log Message Content in Production

Log only: model name, token usage, latency, request ID. Use structured logging.

### Rotate API Keys Regularly

Treat LLM API keys like database passwords. Rotate every 90 days. Revoke immediately on suspected leak.

---

## ✅ Reliability

### Always Set a Timeout

Wrap every LLM call in a context with a deadline. 60s is a reasonable default for non-streaming.

### Implement Retry with Exponential Backoff

Retry on 429, 529, 503. Use jitter to avoid thundering herd. Max 3 retries with 2x backoff.

```go
func withRetry(ctx context.Context, fn func() error) error {
    backoff := 1 * time.Second
    for attempt := range 3 {
        err := fn()
        if err == nil { return nil }
        if attempt == 2 { return err }
        select {
        case <-time.After(backoff + jitter()):
        case <-ctx.Done(): return ctx.Err()
        }
        backoff *= 2
    }
    return nil
}
```

### Set max_tokens Explicitly

Always set to the minimum needed. Never rely on model default.

### Handle Partial / Empty Responses

LLMs can return empty content or stop mid-generation. Always check content length before accessing index 0.

---

## ✅ Cost Control

### Track Token Usage Per Request

Log `input_tokens` and `output_tokens` from every response. Aggregate per user/feature/endpoint.

### Use Cheaper Models for Simple Tasks

Classification, intent detection, simple extraction → use small/fast models. Reserve frontier models for complex reasoning.

### Cache Deterministic Responses

If the same prompt+input produces the same output (e.g. document classification), cache by content hash. Avoid re-calling the API.

### Set Spending Alerts

Configure budget alerts on the provider dashboard. Hard-limit per key if available.

---

## ✅ Maintainability

### Store Prompts as Files, Not Strings

Keep prompts in `prompts/` or `internal/prompts/` as `.md` or `.txt` files. Load at startup. Version control them.

### Version Your Prompts

Use semantic versioning or date stamps for prompt files. Track changes in git. Roll back independently of code.

### Pin Model Versions

Use dated snapshot model names (e.g. `claude-opus-4-5-20251101`, `gpt-4o-2024-08-06`) in production. Only upgrade intentionally after testing.

### Separate Prompt Logic from Business Logic

Prompt construction should be in its own module/package. Business logic should not know about token limits or model names.

---

## ✅ Output Quality

### Use Structured Outputs / Tool Use for Parseable Data

For any response you'll parse — use JSON mode, structured outputs, or tool use. Never parse free-text with regex.

### Set Temperature Explicitly

- `temperature: 0` for deterministic tasks (extraction, classification, code generation)
- `temperature: 0.3–0.7` for creative/generative tasks
- Never rely on default

### Validate LLM Output Schema

After receiving structured output, validate it against your expected schema before using it in business logic.

### Use System Prompt for Instructions, User Turn for Data

Instructions and persona → system prompt. User data, documents, context → user turn. Never mix.

---

## ✅ Conversation Management

### Implement Context Window Management

Track token count of conversation history. Truncate oldest messages or summarize when approaching limit.

### Use Message Roles Correctly

- `system` → instructions, persona, constraints
- `user` → input, data, questions
- `assistant` → prior model responses only (never fake)

### Clear Conversation History on Session End

Don't persist conversation history longer than needed. Respect user privacy.

---

## ✅ Testing AI Code

### Test Prompt Behavior with Fixed Inputs

For deterministic tasks (`temperature: 0`), write unit tests that assert on LLM output for known inputs. Mock the API call in CI.

### Test Error Handling Separately

Write tests that simulate 429, 503, empty response, malformed JSON. Don't assume the happy path.

### Use Evals for Non-Deterministic Tasks

For tasks where output varies, use LLM-as-judge evals or golden dataset comparisons rather than exact string matching.
