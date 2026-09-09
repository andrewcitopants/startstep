"use client";

import { useEffect, useRef, useState } from "react";

const TIMER_DURATION_SECONDS = 120;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function Home() {
  const [task, setTask] = useState("");
  const [step, setStep] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_DURATION_SECONDS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleGetStep = async () => {
    const trimmedTask = task.trim();
    if (!trimmedTask || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // ---- AI API CALL: server-side route, keeps GEMINI_API_KEY off the client ----
      const response = await fetch("/api/first-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: trimmedTask }),
      });
      const data = await response.json();
      // -------------------------------------------------------------------------

      if (!response.ok) {
        throw new Error(data?.error ?? "Something went wrong.");
      }

      setStep(data.step);

      if (intervalRef.current) clearInterval(intervalRef.current);
      setSecondsLeft(TIMER_DURATION_SECONDS);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const timeIsUp = step !== null && secondsLeft === 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium tracking-wide text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
            StartStep
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Stuck on a task?
          </h1>
          <p className="max-w-sm text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Tell us what you&apos;re avoiding. We&apos;ll give you one tiny
            first step and a short timer to just start.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <label htmlFor="task" className="sr-only">
            What are you stuck on?
          </label>
          <textarea
            id="task"
            name="task"
            rows={3}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Write the intro for my essay"
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={handleGetStep}
            disabled={!task.trim() || isLoading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-600 text-base font-medium text-white transition-colors hover:bg-teal-700 active:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
          >
            {isLoading ? "Thinking…" : "Give me a first step"}
          </button>
        </div>

        <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Your first step
          </p>
          {error ? (
            <p className="text-base font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : (
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              {step ?? "Your tiny next step will show up here."}
            </p>
          )}
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-lg font-semibold ${
              timeIsUp
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"
            }`}
          >
            {formatTime(step ? secondsLeft : TIMER_DURATION_SECONDS)}
          </div>
          {timeIsUp && (
            <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
              Time&apos;s up — how&apos;d it go?
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
