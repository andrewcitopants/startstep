import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildPrompt(task: string) {
  return `Someone is procrastinating on this specific task: "${task}".

Give them exactly ONE tiny first step they could do right now, in under two minutes, that directly moves THIS task forward. It should feel almost too small to skip.

Rules:
- The step MUST reference specific words, names, or details from the task itself ("${task}") — not generic language that could apply to any task.
- The step must directly advance this particular task. Do NOT suggest generic "unstick" tricks like standing up, walking around, stretching, or getting water unless the task is literally about that.
- Do NOT assume any specific tool, app, device, or location (e.g. "open your laptop," "check your email," "go to your desk") unless the user's own text names it. If the task doesn't mention a tool or place, keep the step tool-agnostic and focus on the physical or mental act of starting — like getting ready, moving toward where the task happens, or taking the very first real-world action.
- The step happens outside this app (on paper, in a notes app, in a file, in an email, physically, etc., as appropriate), never typed into this app — this app has no text field to submit a step into.
- Keep it under 15 words.
- Make it concrete and unambiguous, not vague encouragement.

Examples:
- Task: "I have an idea but don't know how to execute it" → good: "Open a blank note and write your idea's title as the first line." (specific, no assumed tool beyond a generic note)
- Task: "I have to work but don't want to go" → good: "Put on the shoes or clothes you'd wear to work." (physical act of starting, no assumed tool) — bad: "Open your work laptop" (assumes a tool the task never mentioned)
- Bad in general: "Stand up and walk around" — too generic, ignores the task's content.

Respond with ONLY that first step as a single short sentence. No preamble, no quotation marks, no numbering, no extra commentary.`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const task = typeof body?.task === "string" ? body.task.trim() : "";
  if (!task) {
    return NextResponse.json({ error: "task is required." }, { status: 400 });
  }

  const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(task) }] }],
    }),
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error("Gemini API error:", geminiResponse.status, errorText);
    return NextResponse.json(
      { error: "Failed to generate a first step. Please try again." },
      { status: 502 },
    );
  }

  const data = await geminiResponse.json();
  const step: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  if (!step) {
    return NextResponse.json(
      { error: "Failed to generate a first step. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ step });
}
