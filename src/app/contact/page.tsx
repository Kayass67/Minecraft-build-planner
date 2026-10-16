"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Suspense } from "react";

const INQUIRY_TYPES = [
  { value: "general", label: "General Inquiry" },
  { value: "feedback", label: "Feature Feedback & Ideas" },
  { value: "bug_report", label: "Bug Report" },
  { value: "sponsorship", label: "Sponsorship & Advertising" },
  { value: "partnership", label: "Community Partnership" },
  { value: "other", label: "Other / Legal" },
];

function ContactForm() {
  const searchParams = useSearchParams();
  const isSponsorship = searchParams.get("type") === "sponsorship";

  const [name, setName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [inquiryType, setInquiryType] = useState(isSponsorship ? "sponsorship" : "general");
  const [subject, setSubject] = useState(
    isSponsorship ? "Sponsorship Inquiry: MineBuild Project" : ""
  );
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Anti-spam hidden field

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client checks
    if (!name.trim() || !replyEmail.trim() || !subject.trim() || !message.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyEmail.trim())) {
      setError("Please enter a valid reply email address.");
      return;
    }

    // Bot check
    if (honeypot) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          replyEmail: replyEmail.trim(),
          inquiryType,
          subject: subject.trim(),
          message: message.trim(),
          honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to deliver message. Please try again.");
      }

      setSuccess({
        id: data.messageId || "msg_received",
        message:
          "Thank you! Your message has been received securely. If a reply is required, we will reach out to your provided email address.",
      });
      // Clear form
      setName("");
      setReplyEmail("");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while sending your message.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-md">
      {success ? (
        <div className="py-10 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Message Delivered</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {success.message}
          </p>
          <div className="text-xs text-slate-500 font-mono">
            Reference ID: {success.id}
          </div>
          <div className="pt-4">
            <Button
              onClick={() => setSuccess(null)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              Send Another Message
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-950/60 border-red-900 text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* Hidden honeypot field for spam prevention */}
          <input
            type="text"
            name="website_url"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex or Minecraft Handle"
                required
                maxLength={70}
                className="bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Reply Email *
              </label>
              <Input
                type="email"
                value={replyEmail}
                onChange={(e) => setReplyEmail(e.target.value)}
                placeholder="you@example.com"
                required
                maxLength={100}
                className="bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Inquiry Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Inquiry Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INQUIRY_TYPES.map((type) => {
                const selected = inquiryType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setInquiryType(type.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      selected
                        ? "bg-cyan-950/80 border-cyan-500/80 text-cyan-200 shadow-sm"
                        : "bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    {type.value === "sponsorship" ? (
                      <DollarSign className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Subject *
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this regarding?"
              required
              maxLength={120}
              className="bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-cyan-400"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide as much context, feedback, or inquiry detail as possible…"
              required
              rows={5}
              maxLength={2000}
              className="w-full rounded-md bg-slate-950/80 border border-slate-800 p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <p className="text-[11px] text-slate-500 text-right mt-1">
              {message.length} / 2000 characters
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Your message is stored securely and accessed exclusively by the project maintainers. We never share or sell contact details. See our{" "}
              <Link href="/privacy" className="text-cyan-400 hover:underline">
                Privacy Policy
              </Link>.
            </span>
          </div>

          {/* Submit CTA */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-950/40"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Delivering Message…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20 flex-1 flex flex-col justify-center">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <div className="inline-flex p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 mb-1">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100">
          Get in Touch
        </h1>
        <p className="text-sm md:text-base text-slate-400 leading-relaxed">
          Have feedback on schematic calculations, found a bug, or want to discuss a sponsorship or community partnership? Send us a message below.
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-12 text-slate-500">Loading contact form…</div>}>
        <ContactForm />
      </Suspense>
    </main>
  );
}
