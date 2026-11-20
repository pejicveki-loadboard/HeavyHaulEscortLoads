"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type PilotCarAccessRow = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  signedUp: string;
  trialStarted: string;
  trialEnds: string;
  status: string;
  paidStarted: string;
  accessEnabled: boolean;
  accessLabel: string;
  freeUntilDate: string | null; // last covered day, YYYY-MM-DD (Central)
  accessNote: string | null;
  accessUpdated: string | null;
};

type Action =
  | { action: "enable" | "disable" | "clearFreeUntil"; profileIds: string[] }
  | { action: "setFreeUntil"; profileIds: string[]; freeUntil: string }
  | { action: "setNote"; profileIds: string[]; note: string };

type Confirm = { title: string; body: string; confirmLabel: string; run: () => void };

const btn =
  "rounded border border-brand-border px-2 py-1 text-xs text-brand-text transition-all duration-150 hover:border-brand-accent active:scale-[0.97] disabled:opacity-50";
const btnDanger =
  "rounded border border-red-500/60 px-2 py-1 text-xs text-red-300 transition-all duration-150 hover:border-red-400 active:scale-[0.97] disabled:opacity-50";
const input =
  "rounded border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-text";

export function PilotCarAccessTable({
  rows,
  today,
  sortHrefs,
}: {
  rows: PilotCarAccessRow[];
  today: string;
  sortHrefs: { companyName: string; createdAt: string; trialEndsAt: string };
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [bulkDate, setBulkDate] = useState("");
  const [dates, setDates] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  async function send(payload: Action, okText: string, bulk = false) {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pilot-cars/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error ?? "Something went wrong." });
        return;
      }
      setMessage({ kind: "ok", text: okText });
      if (bulk) {
        setSelected(new Set());
        setBulkDate("");
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function rowSwitch(row: PilotCarAccessRow) {
    if (row.accessEnabled) {
      setConfirm({
        title: `Turn off access for ${row.companyName}?`,
        body: "They immediately lose load search, load details, contact info and all alerts (email, SMS, push), even if they are paying. They'll see “Your access is paused.”",
        confirmLabel: "Turn off",
        run: () => send({ action: "disable", profileIds: [row.id] }, `Access turned off for ${row.companyName}.`),
      });
    } else {
      send({ action: "enable", profileIds: [row.id] }, `Access turned on for ${row.companyName}.`);
    }
  }

  const ids = [...selected];
  const n = ids.length;
  const plural = `${n} profile${n === 1 ? "" : "s"}`;

  return (
    <div className="flex flex-col gap-3">
      {n > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded border border-brand-accent bg-brand-accent/10 p-2 text-sm text-brand-text">
          <span className="font-semibold">{n} selected</span>
          <button
            className={btn}
            disabled={pending}
            onClick={() =>
              setConfirm({
                title: `Turn on access for ${plural}?`,
                body: "Restores load-board access and alerts, subject to the promo, grants and their subscription.",
                confirmLabel: "Turn on",
                run: () => send({ action: "enable", profileIds: ids }, `Access turned on for ${plural}.`, true),
              })
            }
          >
            Turn on
          </button>
          <button
            className={btnDanger}
            disabled={pending}
            onClick={() =>
              setConfirm({
                title: `Turn off access for ${plural}?`,
                body: "They immediately lose load search, details, contact info and all alerts, including paying subscribers.",
                confirmLabel: "Turn off",
                run: () => send({ action: "disable", profileIds: ids }, `Access turned off for ${plural}.`, true),
              })
            }
          >
            Turn off
          </button>
          <span className="ml-2 text-brand-muted">Free until</span>
          <input
            type="date"
            className={input}
            min={today}
            value={bulkDate}
            onChange={(e) => setBulkDate(e.target.value)}
            aria-label="Bulk free-until date"
          />
          <button
            className={btn}
            disabled={pending || !bulkDate}
            onClick={() =>
              setConfirm({
                title: `Grant free access until ${bulkDate} to ${plural}?`,
                body: "Replaces any existing free-until date on these profiles. Applies after the promo ends (end of that day, Central).",
                confirmLabel: "Set date",
                run: () =>
                  send({ action: "setFreeUntil", profileIds: ids, freeUntil: bulkDate }, `Free until ${bulkDate} set for ${plural}.`, true),
              })
            }
          >
            Set
          </button>
          <button className={`${btn} ml-auto`} onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      {message && (
        <p role="status" className={`text-sm ${message.kind === "ok" ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto rounded border border-brand-border bg-brand-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-brand-text">
              <th className="p-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all on this page" />
              </th>
              <th className="p-2">
                <Link href={sortHrefs.companyName}>Company</Link>
              </th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">
                <Link href={sortHrefs.createdAt}>Signed up</Link>
              </th>
              <th className="p-2">Trial started</th>
              <th className="p-2">
                <Link href={sortHrefs.trialEndsAt}>Trial ends</Link>
              </th>
              <th className="p-2">Status</th>
              <th className="p-2">Paid started</th>
              <th className="p-2">Access</th>
              <th className="p-2">Free until</th>
              <th className="p-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dateValue = dates[row.id] ?? row.freeUntilDate ?? "";
              const noteValue = notes[row.id] ?? row.accessNote ?? "";
              const noteDirty = noteValue !== (row.accessNote ?? "");
              return (
                <tr key={row.id} className="border-b border-brand-border align-top text-brand-text">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      aria-label={`Select ${row.companyName}`}
                    />
                  </td>
                  <td className="p-2">{row.companyName}</td>
                  <td className="p-2">{row.email}</td>
                  <td className="p-2 whitespace-nowrap">{row.phone}</td>
                  <td className="p-2">{row.signedUp}</td>
                  <td className="p-2">{row.trialStarted}</td>
                  <td className="p-2">{row.trialEnds}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{row.paidStarted}</td>
                  <td className="p-2">
                    <div className="flex min-w-36 flex-col gap-1">
                      <label className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.accessEnabled}
                          aria-label={`Access for ${row.companyName}`}
                          disabled={pending}
                          onClick={() => rowSwitch(row)}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 disabled:opacity-50 ${
                            row.accessEnabled ? "border-brand-accent bg-brand-accent" : "border-brand-border bg-brand-bg"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-brand-text transition-transform duration-150 ${
                              row.accessEnabled ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        {row.accessEnabled ? "On" : "Off"}
                      </label>
                      <span className={`text-xs ${row.accessEnabled ? "text-brand-muted" : "text-red-300"}`}>
                        {row.accessLabel}
                      </span>
                      {row.accessUpdated && (
                        <span className="text-[11px] text-brand-muted">changed {row.accessUpdated}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex min-w-40 flex-col gap-1">
                      <input
                        type="date"
                        className={input}
                        min={today}
                        value={dateValue}
                        onChange={(e) => setDates((d) => ({ ...d, [row.id]: e.target.value }))}
                        aria-label={`Free until date for ${row.companyName}`}
                      />
                      <div className="flex gap-1">
                        <button
                          className={btn}
                          disabled={pending || !dateValue || dateValue === row.freeUntilDate}
                          onClick={() =>
                            send(
                              { action: "setFreeUntil", profileIds: [row.id], freeUntil: dateValue },
                              `Free until ${dateValue} set for ${row.companyName}.`
                            )
                          }
                        >
                          Set
                        </button>
                        {row.freeUntilDate && (
                          <button
                            className={btn}
                            disabled={pending}
                            onClick={() =>
                              setConfirm({
                                title: `Remove the free-until date for ${row.companyName}?`,
                                body: "After the promo ends they'll need an active trial or subscription.",
                                confirmLabel: "Remove",
                                run: () => {
                                  setDates((d) => ({ ...d, [row.id]: "" }));
                                  send({ action: "clearFreeUntil", profileIds: [row.id] }, `Free-until cleared for ${row.companyName}.`);
                                },
                              })
                            }
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex min-w-48 flex-col gap-1">
                      <textarea
                        rows={2}
                        maxLength={500}
                        className={`${input} resize-y`}
                        value={noteValue}
                        placeholder="Why access is set this way…"
                        onChange={(e) => setNotes((m) => ({ ...m, [row.id]: e.target.value }))}
                        aria-label={`Access note for ${row.companyName}`}
                      />
                      {noteDirty && (
                        <button
                          className={`${btn} self-start`}
                          disabled={pending}
                          onClick={() =>
                            send({ action: "setNote", profileIds: [row.id], note: noteValue }, `Note saved for ${row.companyName}.`)
                          }
                        >
                          Save note
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="p-2 text-brand-muted">
                  No matching Pilot Car profiles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirm(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded border border-brand-border bg-brand-panel p-5 text-brand-text shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="mb-2 text-lg font-semibold">
              {confirm.title}
            </h2>
            <p className="mb-4 text-sm text-brand-muted">{confirm.body}</p>
            <div className="flex justify-end gap-2">
              <button className={btn} autoFocus onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className={confirm.confirmLabel.startsWith("Turn off") ? btnDanger : btn}
                onClick={() => {
                  const run = confirm.run;
                  setConfirm(null);
                  run();
                }}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
