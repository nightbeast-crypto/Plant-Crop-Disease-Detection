import { NextResponse } from "next/server";
import { Client } from "@gradio/client";

const MODEL_ENDPOINT =
  "https://router.huggingface.co/hf-inference/models/surgeonwz/plant-village";
const LIVE_ANALYSIS_SPACE = "ERN-low/plant-disease-detector";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface ModelPrediction {
  label: string;
  score: number;
}

async function analyzeWithInferenceApi(image: File, token: string) {
  const response = await fetch(MODEL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": image.type || "application/octet-stream",
    },
    body: await image.arrayBuffer(),
  });

  const responseBody = await response.text();
  let result: unknown;
  try {
    result = JSON.parse(responseBody);
  } catch {
    result = null;
  }

  if (!response.ok) {
    const detail =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : `Inference request failed with status ${response.status}.`;
    throw new Error(detail);
  }

  if (
    !Array.isArray(result) ||
    !result.every(
      (prediction): prediction is ModelPrediction =>
        typeof prediction === "object" &&
        prediction !== null &&
        "label" in prediction &&
        typeof prediction.label === "string" &&
        "score" in prediction &&
        typeof prediction.score === "number"
    )
  ) {
    throw new Error("The inference service returned an invalid response.");
  }

  return {
    confidences: result.map(({ label, score }) => ({
      label,
      confidence: score,
    })),
  };
}

function decodeHtmlText(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}

function parseSpaceResult(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("The analysis service returned an invalid response.");
  }

  const statusMatch = value.match(/<div class="report (healthy|unsure|disease)"/);
  const predictions = Array.from(
    value.matchAll(
      /<div class="g(?: first)?"><div class="g-top"><span>(.*?)<\/span><b>(\d+)%<\/b><\/div>/g
    ),
    ([, rawLabel, rawConfidence]) => {
      const [name, diagnosis] = decodeHtmlText(rawLabel).split(/\s*[—–]\s*/, 2);
      return {
        label: `${name}___${(diagnosis || "unknown").replace(/\s+/g, "_")}`,
        confidence: Number(rawConfidence) / 100,
      };
    }
  );

  if (predictions.length === 0) {
    throw new Error("The analysis service returned no plant predictions.");
  }

  return {
    confidences: predictions,
    status: statusMatch?.[1] as "healthy" | "unsure" | "disease" | undefined,
    confidenceIsRounded: true,
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image must be between 1 byte and 5 MB." },
        { status: 400 }
      );
    }

    const inferenceToken = process.env.HUGGINGFACE_API_TOKEN;
    if (inferenceToken) {
      const analysis = await analyzeWithInferenceApi(image, inferenceToken);
      return NextResponse.json({
        ...analysis,
        confidenceIsRounded: false,
        analyzedAt: new Date().toISOString(),
      });
    }

    const client = await Client.connect(LIVE_ANALYSIS_SPACE);
    const result = await client.predict("/predict_1", { path: image });

    if (
      result &&
      result.data &&
      Array.isArray(result.data) &&
      typeof result.data[0] === "string"
    ) {
      return NextResponse.json({
        ...parseSpaceResult(result.data[0]),
        analyzedAt: new Date().toISOString(),
      });
    } else {
      throw new Error("Invalid response structure from analysis service.");
    }
  } catch (error) {
    console.error("Internal API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      {
        error: process.env.HUGGINGFACE_API_TOKEN
          ? errorMessage
          : "The plant analysis service is currently unavailable. Please try again later.",
      },
      { status: 500 }
    );
  }
}
