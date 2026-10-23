# Plant Disease Detection
<p align="center">
 <img src=https://github.com/luanvenancio/plant-disease-detection/assets/9398249/0183486f-666b-4947-b52e-5c7311483df8 alt="Screenshot of the Home Page" width="80%"/>
</p>

## Overview
This project is a Next.js web application for plant-leaf disease classification. The browser uploads an image to the app's `/api/analyze` route, which calls a hosted Hugging Face Gradio Space and returns the model's diagnosis and top predictions. The classifier is hosted remotely; this repository does not contain or run the model locally.

## Features
1. **Plant-health analysis:** Upload a leaf photo and review the predicted crop, condition, confidence, and top three classes.
2. **Responsive interface:** A dark-themed Next.js and React interface supports uploading another image directly from the result.
3. **Hosted inference:** The server-side API integrates with a Hugging Face Gradio Space. Images are sent to that hosted service for analysis.
4. **Transparent model limitations:** The current Space returns confidence rounded to whole percentages and does not expose model activations for Grad-CAM. It also does not estimate disease severity, so the UI does not display a heatmap or severity score.

## Technical Documentation

See [PROJECT_TECHNIQUES.md](./PROJECT_TECHNIQUES.md) for the application architecture, hosted model, image-preprocessing pipeline, inference techniques, reported evaluation metrics, and limitations.

## Getting Started

1. **Clone the Repository:**
    - Clone this repository and open its project directory:

      ```powershell
      git clone https://github.com/nightbeast-crypto/Plant-Crop-Disease-Detection.git
      cd Plant-Crop-Disease-Detection
      ```
2. **Install Dependencies:**
    - Ensure you have Node.js and npm installed.
    - Run `npm install` from the project directory to install dependencies.

3. **Run the Web Interface Locally:**
    - Start the development server using `npm run dev`.

## Analysis Service Configuration

Analysis uses the public Hugging Face Space `ERN-low/plant-disease-detector`. Uploaded photos are sent to that service for classification. If you prefer to use the `surgeonwz/plant-village` model directly instead, the API route supports a Hugging Face token with Inference Providers access.

For the optional direct-model integration, copy `.env.example` to `.env.local`, replace the placeholder with your token, and restart the development server:

```powershell
Copy-Item .env.example .env.local
```

Create a token in your Hugging Face account with permission to use Inference Providers. Keep it in `.env.local` (which is git-ignored) or your deployment platform's server environment settings. Never expose it in client-side code or commit it to the repository.

## Contributions
Contributions are welcome! Feel free to submit pull requests, report issues, or suggest improvements. Let’s build a robust and user-friendly platform for plant disease detection together!

Feel free to customize and expand upon this project description according to your needs. Happy coding! 🌱🔍👩‍💻
