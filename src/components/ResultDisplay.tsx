"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  Leaf,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { DialogTrigger } from "./ui/dialog";
import { diseaseData } from "@/lib/disease-data";
import { Button } from "./ui/button";

interface Prediction {
  label: string;
  confidence: number;
}

interface PlantAnalysis {
  name: string;
  diagnosis: string;
  score: number;
  status: "healthy" | "unsure" | "disease";
  predictions: Prediction[];
  confidenceIsRounded: boolean;
  analyzedAt: string;
}

interface ResultDisplayProps {
  plantAnalysis: PlantAnalysis;
  img: File;
  onScanAnother: () => void;
}

const statusContent = {
  healthy: {
    label: "Likely healthy",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
  },
  disease: {
    label: "Likely infected",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: ShieldAlert,
  },
  unsure: {
    label: "Uncertain",
    className: "border-violet-400/30 bg-violet-400/10 text-violet-200",
    icon: AlertTriangle,
  },
} as const;

function formatAnalyzedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function ResultDisplay({
  plantAnalysis,
  img,
  onScanAnother,
}: ResultDisplayProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeImageTab, setActiveImageTab] = useState<"original" | "attention">(
    "original"
  );
  const diagnosisKey = plantAnalysis.diagnosis.toLowerCase().replace(/\s/g, "");
  const canLearnMore = diseaseData[diagnosisKey] !== undefined;
  const status = statusContent[plantAnalysis.status];
  const StatusIcon = status.icon;
  const confidencePercent = Math.round(plantAnalysis.score * 100);

  useEffect(() => {
    const url = URL.createObjectURL(img);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [img]);

  return (
    <div className="w-full space-y-5">
      <section className="overflow-hidden rounded-2xl border border-emerald-500/15 bg-card shadow-xl shadow-black/10">
        <div className="grid md:grid-cols-2">
          <div className="border-b border-border/70 p-4 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ScanLine className="size-4 text-emerald-400" />
                Image review
              </p>
              <div className="flex rounded-lg border border-border bg-background/70 p-1">
                <button
                  type="button"
                  aria-pressed={activeImageTab === "original"}
                  onClick={() => setActiveImageTab("original")}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                    activeImageTab === "original"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Original image
                </button>
                <button
                  type="button"
                  aria-pressed={activeImageTab === "attention"}
                  onClick={() => setActiveImageTab("attention")}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                    activeImageTab === "attention"
                      ? "bg-violet-500/15 text-violet-200"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  AI attention
                </button>
              </div>
            </div>

            <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-xl bg-black/20">
              {activeImageTab === "original" && imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Uploaded plant leaf"
                  className="max-h-[440px] w-full object-contain"
                />
              ) : (
                <div className="max-w-sm px-6 py-10 text-center">
                  <Info className="mx-auto mb-3 size-7 text-violet-300" />
                  <p className="font-medium text-foreground">
                    Attention map unavailable
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The hosted classifier returns predictions, but does not
                    expose the model layers or activations Grad-CAM needs. No
                    heatmap is generated, so highlighted regions would be
                    misleading.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveImageTab("original")}
                    className="mt-4 text-sm font-medium text-emerald-300 hover:text-emerald-200"
                  >
                    Return to original image
                  </button>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              A future attention map would show image regions influencing the
              prediction, not definitive proof of disease location.
            </p>
          </div>

          <div className="flex flex-col p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Leaf className="size-4 text-emerald-400" />
                  {plantAnalysis.name}
                </div>
                <motion.h3
                  className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  {plantAnalysis.diagnosis}
                </motion.h3>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
              >
                <StatusIcon className="size-3.5" />
                {status.label}
              </span>
            </div>

            <div className="mt-8 rounded-xl border border-border/70 bg-background/50 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Model confidence
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                    {plantAnalysis.confidenceIsRounded ? "≈" : ""}
                    {confidencePercent}%
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="About model confidence"
                        className="mb-1 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Info className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Confidence is the model&apos;s score for its top
                        prediction, not a guarantee of correctness.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-label="Model confidence"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={confidencePercent}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, confidencePercent))}%`,
                  }}
                />
              </div>
              {plantAnalysis.confidenceIsRounded && (
                <p className="mt-2 text-xs text-muted-foreground">
                  The hosted model reports confidence rounded to the nearest
                  whole percent.
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              Analyzed {formatAnalyzedAt(plantAnalysis.analyzedAt)}
            </div>

            <div className="mt-auto flex flex-wrap gap-3 pt-7">
              <Button
                className="bg-violet-600 text-white hover:bg-violet-700"
                onClick={onScanAnother}
              >
                Scan Another Plant
              </Button>
              {canLearnMore && plantAnalysis.status !== "healthy" && (
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:border-emerald-500/40"
                  >
                    Learn more
                  </Button>
                </DialogTrigger>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-foreground">
            Top predictions
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The three most likely classes returned by the model.
          </p>
        </div>
        <div className="space-y-4">
          {plantAnalysis.predictions.map((prediction, index) => {
            const percent = Math.round(prediction.confidence * 100);
            return (
              <div key={`${prediction.label}-${index}`}>
                <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                  <span className="min-w-0 truncate text-foreground">
                    <span className="mr-2 text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    {prediction.label}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
                    {plantAnalysis.confidenceIsRounded ? "≈" : ""}
                    {percent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      index === 0
                        ? "bg-gradient-to-r from-emerald-500 to-violet-500"
                        : "bg-emerald-500/50"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {plantAnalysis.confidenceIsRounded && (
          <p className="mt-4 text-xs text-muted-foreground">
            Scores are approximate because the hosted classifier only returns
            whole-percent values.
          </p>
        )}
      </section>
    </div>
  );
}
