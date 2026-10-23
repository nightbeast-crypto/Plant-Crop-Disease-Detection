"use client";

import { useToast } from "@/components/ui/use-toast";
import useSWR from "swr";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";
import { AnalysisLoader } from "./AnalysisLoader";
import { ResultDisplay } from "./ResultDisplay";
import { useState } from "react";
import { diseaseData } from "@/lib/disease-data";
import { Dialog, DialogContent } from "./ui/dialog";
import { DetailsModalContent } from "./DetailsModalContent";

interface GradioOutput {
  confidences: { label: string; confidence: number }[];
  status?: "healthy" | "unsure" | "disease";
  confidenceIsRounded: boolean;
  analyzedAt: string;
}

function isGradioOutput(value: unknown): value is GradioOutput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const output = value as Partial<GradioOutput>;
  return (
    Array.isArray(output.confidences) &&
    output.confidences.every(
      (prediction) =>
        typeof prediction === "object" &&
        prediction !== null &&
        typeof prediction.label === "string" &&
        typeof prediction.confidence === "number"
    ) &&
    (output.status === undefined ||
      output.status === "healthy" ||
      output.status === "unsure" ||
      output.status === "disease") &&
    typeof output.confidenceIsRounded === "boolean" &&
    typeof output.analyzedAt === "string"
  );
}

const customVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -20 },
};

const customTransition: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.4,
};

export function ResultCard({
  img,
  onScanAnother,
}: {
  img: File;
  onScanAnother: () => void;
}) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetcher = async (url: string): Promise<GradioOutput> => {
    const formData = new FormData();
    formData.append("image", img);
    const response = await fetch(url, { method: "POST", body: formData });
    const responseText = await response.text();
    let responseBody: unknown;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      const errorMessage =
        typeof responseBody === "object" &&
        responseBody !== null &&
        "error" in responseBody &&
        typeof responseBody.error === "string"
          ? responseBody.error
          : `Analysis request failed (HTTP ${response.status}). Please try again.`;
      throw new Error(
        errorMessage
      );
    }

    if (!isGradioOutput(responseBody)) {
      throw new Error("The analysis service returned an invalid response.");
    }
    return responseBody;
  };

  const key = img
    ? `/api/analyze?name=${encodeURIComponent(img.name)}&size=${img.size}&modified=${img.lastModified}`
    : null;
  const { data, error, isLoading } = useSWR<GradioOutput>(key, fetcher, {
    shouldRetryOnError: false,
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err.message,
      });
    },
  });

  const getPlantAnalysis = () => {
    if (!data || !data.confidences || data.confidences.length === 0)
      return null;

    const topPrediction = data.confidences[0];
    const score = topPrediction.confidence;
    const label = topPrediction.label;

    let name = "";
    let diagnosis = "";

    if (label.includes("___")) {
      const parts = label.split("___");
      name = parts[0].replace(/_/g, " ");
      diagnosis = parts[1].replace(/_/g, " ");
    } else {
      const parts = label.split("_");
      name = parts[0];
      diagnosis = parts.slice(1).join(" ");
    }

    const predictions = data.confidences.slice(0, 3).map((prediction) => {
      let predName = "";
      let predDiag = "";
      if (prediction.label.includes("___")) {
        [predName, predDiag] = prediction.label.split("___");
      } else {
        const parts = prediction.label.split("_");
        predName = parts[0];
        predDiag = parts.slice(1).join(" ");
      }
      return {
        label: `${predName.replace(/_/g, " ")} — ${predDiag.replace(
          /_/g,
          " "
        )}`,
        confidence: prediction.confidence,
      };
    });

    const normalizedDiagnosis = diagnosis.toLowerCase();
    const status =
      data.status ??
      (normalizedDiagnosis.includes("healthy")
        ? "healthy"
        : score < 0.4
          ? "unsure"
          : "disease");

    return {
      name,
      diagnosis,
      score,
      status,
      predictions,
      confidenceIsRounded: data.confidenceIsRounded,
      analyzedAt: data.analyzedAt,
    };
  };

  const plantAnalysis = getPlantAnalysis();
  const diagnosisKey =
    plantAnalysis?.diagnosis.toLowerCase().replace(/\s/g, "") || "";
  const detailsData = diseaseData[diagnosisKey];
  const detailsPlantAnalysis = plantAnalysis
    ? {
        name: plantAnalysis.name,
        diagnosis: plantAnalysis.diagnosis,
        otherPredictions: plantAnalysis.predictions.slice(1),
      }
    : null;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <div className="flex w-full flex-col items-center justify-center py-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              variants={customVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={customTransition}
            >
              <AnalysisLoader img={img} />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              variants={customVariants}
              initial="initial"
              animate="animate"
            >
              <div className="text-red-500 text-center p-4">
                Error: {error.message}
              </div>
            </motion.div>
          ) : plantAnalysis ? (
            <motion.div
              key="result"
              variants={customVariants}
              initial="initial"
              animate="animate"
              transition={customTransition}
              className="flex w-full max-w-5xl flex-col items-center gap-6"
            >
              <h2 className="text-xl font-semibold tracking-tight">
                Analysis Result
              </h2>
              <ResultDisplay
                plantAnalysis={plantAnalysis}
                img={img}
                onScanAnother={onScanAnother}
              />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              variants={customVariants}
              initial="initial"
              animate="animate"
            >
              <div className="text-red-500">
                Could not parse analysis results.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {detailsPlantAnalysis && detailsData && (
        <DialogContent className="sm:max-w-2xl border-border">
          <DetailsModalContent
            plantAnalysis={detailsPlantAnalysis}
            detailsData={detailsData}
            img={img}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
