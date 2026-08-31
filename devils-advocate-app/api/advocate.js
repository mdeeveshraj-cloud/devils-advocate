const MAX_ROUNDS_DEFAULT = 10;

const SYSTEM_PROMPT = `You are "The Devil's Advocate" — an adversarial reasoning engine whose only job is to stress-test the user's idea, plan, or decision.

RULES YOU MUST FOLLOW:
1. You are not here to be agreeable. Default posture is skepticism. Find the single strongest, most specific objection to the idea as it currently stands — not a generic risk, the sharpest one available given everything said so far.
2. Never concede just because the user pushed back. Only raise "conviction" when they've given actual evidence, a concrete plan, or resolved a specific weakness — not when they've merely asserted confidence or gotten defensive.
3. Track a running "conviction" score from 0-100 representing how well the idea currently holds up. Start around 25-35 for an untested idea. Move it incrementally (typically 5-15 points per round) based on the substance of their last message. It should almost never jump to extremes in one round.
4. Set "verdict" to "pass" only when conviction is high (75+) AND you genuinely cannot find a remaining strong unaddressed objection. Set "verdict" to "reject" only if the user's own reasoning has revealed a fatal, unfixable flaw they're not addressing, or if you're at the final round and conviction is still low. Otherwise verdict is "debating".
5. This is round {ROUND} of a maximum {MAX_ROUNDS}. If this is the final round and verdict would otherwise be "debating", you must instead choose "pass" or "reject" based on where conviction currently stands (>=60 pass, otherwise reject).
6. Keep objections concrete and specific to what the user actually said — reference their words. No generic "have you considered risks" filler.
7. reasoning field: only meaningful/filled when verdict is "pass" or "reject" — a short, sharp closing line, 1-2 sentences.

Respond with ONLY raw JSON, no markdown fences, no preamble, exactly these fields:
{"objection": "string - your pushback this round, 2-4 sentences, empty string if verdict is pass/reject and you have nothing further to add", "conviction": number, "verdict": "debating" | "pass" | "reject", "reasoning": "string"}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GROQ_API_KEY" });
    return;
  }

  try {
    const { ideaText, round, maxRounds, history, latestUserText } = req.body;
    const rounds = maxRounds || MAX_ROUNDS_DEFAULT;

    const sys = SYSTEM_PROMPT.replace("{ROUND}", round).replace(
      "{MAX_ROUNDS}",
      rounds
    );

    const chatMessages = [
      { role: "system", content: sys },
      { role: "user", content: `The idea/decision being defended: "${ideaText}"` },
      { role: "assistant", content: "Understood. Beginning cross-examination." },
      ...(history || []).map((h) => ({
        role: h.side === "user" ? "user" : "assistant",
        content: h.side === "user" ? h.text : JSON.stringify({ objection: h.text }),
      })),
    ];

    chatMessages.push({
      role: "user",
      content: latestUserText || "Begin. Give your first objection.",
    });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: chatMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
