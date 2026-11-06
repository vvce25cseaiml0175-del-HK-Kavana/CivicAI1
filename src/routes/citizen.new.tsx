
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Mic, Square, MapPin, Check } from "lucide-react";
import { AppShell } from "@/components/civic/AppShell";
import { Panel } from "@/components/civic/parts";
import {
  CATEGORIES,
  type Category,
  type Severity,
} from "@/lib/api/types";
import { createComplaint } from "@/lib/api/client";
import { useRefresh } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/citizen/new")({
  head: () => ({
    meta: [
      { title: "Report an issue – CivicAI" },
      {
        name: "description",
        content: "Register a civic complaint using text, photograph, voice note and location.",
      },
    ],
  }),
  component: NewComplaint,
});

function NewComplaint() {
  const nav = useNavigate();
  const refresh = useRefresh();

  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [locality, setLocality] = useState("");
  const [reportedSeverity, setReportedSeverity] =
    useState<Severity | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>();
  const [photo, setPhoto] = useState<string>();
  const [voice, setVoice] = useState<Blob>();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const rec = useRef<MediaRecorder | null>(null);

  // At least one description or evidence item is compulsory.
  const hasComplaintContent =
    description.trim().length > 0 || !!photo || !!voice;

  const onPhoto = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPhoto(reader.result as string);
      setError("");
    };

    reader.readAsDataURL(file);
  };

  const toggleRecord = async () => {
    if (recording) {
      rec.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (chunks.length > 0) {
          setVoice(
            new Blob(chunks, {
              type: mediaRecorder.mimeType || "audio/webm",
            })
          );
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      rec.current = mediaRecorder;
      setRecording(true);
      setError("");
    } catch {
      setError("Microphone permission denied. Please allow microphone access.");
    }
  };

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError("");
      },
      () => setError("Could not get location. Please enter your locality.")
    );
  };

  const submit = async () => {
    setError("");

    if (!category) {
      setError("Please select a complaint category.");
      return;
    }

    if (!reportedSeverity) {
      setError("Please select the perceived severity of the issue.");
      return;
    }

    if (!hasComplaintContent) {
      setError(
        "Please provide at least one: a description, an image, or a voice recording."
      );
      return;
    }

    if (locality.trim().length < 3) {
      setError("Please enter your locality or a nearby landmark.");
      return;
    }

    if (recording) {
      setError("Please stop your voice recording before submitting.");
      return;
    }

    setSaving(true);

    try {
      await createComplaint({
        category,
        description: description.trim(),
        locality: locality.trim(),
        reportedSeverity,
        ...coords,
        photoDataUrl: photo,
        voiceBlob: voice,
      });

      refresh();
      nav({ to: "/citizen" });
    } catch {
      setError("Could not submit your complaint. Please try again.");
      setSaving(false);
    }
  };

  const severityOptions: {
    value: Severity;
    label: string;
    description: string;
  }[] = [
    {
      value: "low",
      label: "Low",
      description: "Minor issue",
    },
    {
      value: "medium",
      label: "Medium",
      description: "Needs attention",
    },
    {
      value: "high",
      label: "High",
      description: "Urgent issue",
    },
  ];

  return (
    <AppShell role="citizen">
      <h1 className="mb-2 text-3xl font-bold">Report an issue</h1>

      <p className="mb-5 text-sm text-muted-foreground">
        Provide details about the issue using text, an image, or a voice
        recording. You only need to provide at least one.
      </p>

      <Panel className="max-w-2xl">
        <div className="space-y-5">

          {/* Complaint Category */}
          <section>
            <h2 className="mb-3 font-semibold">
              1. Select complaint category *
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={cn(
                    "rounded-lg border p-4 text-left font-medium transition",
                    category === item.id
                      ? "border-saffron bg-saffron/15"
                      : "hover:bg-muted"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <hr />

          {/* Citizen Reported Severity */}
          <section>
            <h2 className="mb-1 font-semibold">
              2. How severe do you think this issue is? *
            </h2>

            <p className="mb-3 text-xs text-muted-foreground">
              Select your perceived severity. The final severity will be
              assessed separately by the administration.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {severityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={reportedSeverity === option.value}
                  onClick={() => {
                    setReportedSeverity(option.value);
                    setError("");
                  }}
                  className={cn(
                    "rounded-lg border p-4 text-left transition",
                    reportedSeverity === option.value
                      ? "border-saffron bg-saffron/15 ring-1 ring-saffron"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="block font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <hr />

          {/* Text Description */}
          <section>
            <h2 className="mb-1 font-semibold">
              3. Describe the issue
            </h2>

            <p className="mb-2 text-xs text-muted-foreground">
              Optional — you can submit an image or voice recording instead.
            </p>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full rounded-lg border bg-background p-3"
              placeholder="Describe the problem, if you can..."
            />
          </section>

          <hr />

          {/* Image Upload */}
          <section>
            <h2 className="mb-1 font-semibold">
              4. Upload a photograph
            </h2>

            <p className="mb-2 text-xs text-muted-foreground">
              Optional — upload an image showing the infrastructure problem.
            </p>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 hover:bg-muted">
              <Camera className="h-6 w-6 text-primary" />

              <span className="text-sm">
                {photo ? "Change photograph" : "Take or upload a photograph"}
              </span>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => onPhoto(event.target.files?.[0])}
              />
            </label>

            {photo && (
              <img
                src={photo}
                alt="Complaint photograph preview"
                className="mt-3 max-h-48 rounded-lg"
              />
            )}
          </section>

          <hr />

          {/* Voice Recording */}
          <section>
            <h2 className="mb-1 font-semibold">
              5. Record a voice note
            </h2>

            <p className="mb-2 text-xs text-muted-foreground">
              Optional — explain the problem using your voice.
            </p>

            <button
              type="button"
              onClick={toggleRecord}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-4 text-sm",
                recording && "border-destructive"
              )}
            >
              {recording ? (
                <Square className="h-6 w-6 text-destructive" />
              ) : (
                <Mic className="h-6 w-6 text-primary" />
              )}

              {recording
                ? "Recording… tap to stop"
                : voice
                  ? "Re-record voice note"
                  : "Start voice recording"}
            </button>

            {voice && (
              <audio
                controls
                src={URL.createObjectURL(voice)}
                className="mt-3 w-full"
              />
            )}
          </section>

          <hr />

          {/* Location */}
          <section>
            <h2 className="mb-2 font-semibold">
              6. Location *
            </h2>

            <input
              value={locality}
              onChange={(event) => setLocality(event.target.value)}
              maxLength={200}
              className="mb-3 w-full rounded-lg border bg-background p-3"
              placeholder="Street, ward, village or nearby landmark"
            />

            <button
              type="button"
              onClick={locate}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <MapPin className="h-4 w-4" />

              {coords
                ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : "Use my current location"}
            </button>
          </section>

          {/* Validation */}
          <p className="text-xs text-muted-foreground">
            * Category, perceived severity and location are required.
            At least one of description, photograph, or voice recording
            is also required.
          </p>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit */}
          <button
            type="button"
            disabled={saving || recording}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-saffron px-5 py-3 font-semibold text-saffron-foreground disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            {saving ? "Submitting…" : "Submit complaint"}
          </button>
        </div>
      </Panel>
    </AppShell>
  );
}
