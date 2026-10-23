# Project Architecture and Machine-Learning Techniques

## At a glance

This repository contains a web application and an API integration; it does not
contain the plant-classification model weights or run the primary model locally.
The browser sends an uploaded image to the Next.js API route, which calls a
hosted Hugging Face Gradio Space. The current Space identifies itself as an
EfficientNetV2-based TensorFlow classifier.

**This is not a Vision Transformer (ViT) application.** EfficientNetV2 is a
convolutional neural network (CNN), not a transformer. The project previously
used ViT language in its description, but that does not describe the currently
integrated model.

## Application stack

- **Next.js 15 App Router** serves the React interface and the server-side
  `/api/analyze` route.
- **React 19 and TypeScript** implement typed UI components and client-side
  upload/result state.
- **Tailwind CSS 4** provides utility styling; the UI also uses Radix UI
  primitives, `class-variance-authority`, and Framer Motion.
- **SWR** requests and caches analysis results in the browser.
- **`@gradio/client`** connects the API route to the hosted Gradio Space.
- The primary model runtime (TensorFlow/Keras and Pillow) runs on the remote
  Space, not in this Node.js project.

## Prediction path

1. The user selects or drops one image in the upload dialog. The browser accepts
   image MIME types and enforces a 5 MB limit.
2. The client posts the original `File` as multipart form data under the
   `image` field to `POST /api/analyze`.
3. The route checks that a file exists and is non-empty and no larger than 5 MB.
   It does not resize, normalize, or otherwise transform the image in the
   browser or Next.js route.
4. Without `HUGGINGFACE_API_TOKEN`, the route calls the public
   `ERN-low/plant-disease-detector` Space (`/predict_1`) through Gradio. The
   Space's prediction callback returns rendered HTML rather than a structured
   prediction object; the route extracts the crop, class, integer-percent
   confidence, and status from that report.
5. The route returns JSON containing the prediction list, status,
   `confidenceIsRounded`, and analysis timestamp. The UI formats the leading
   class, status, confidence, and top-three scores.

If `HUGGINGFACE_API_TOKEN` is configured on the server, the route instead calls
Hugging Face Inference Providers for the `surgeonwz/plant-village` model. That
optional model endpoint returns structured labels and scores; it is a separate
inference path from the default Space.

## Hosted model and image preprocessing

The primary Space describes its model as an **EfficientNetV2 CNN** fine-tuned
with TensorFlow/Keras. It reports 26 disease classes across 14 crops. Its model
file and class-name mapping are hosted in the Space; they are not included in
this repository.

According to the hosted Space's source code, preprocessing and inference work
as follows:

1. Pillow opens the uploaded file and checks its dimensions before decoding.
   Images over 25 megapixels are rejected.
2. EXIF orientation is applied so photos taken on rotated phones display in the
   expected orientation, and the image is converted to RGB.
3. TensorFlow resizes the RGB pixels with **bilinear interpolation** to the
   input size of the loaded model. The Space source says the v4 model uses
   224 × 224 pixels.
4. Pixel values are passed as raw 0–255 values because the model performs its
   own input rescaling.
5. The classifier scores the image classes. The highest-scoring class is used
   as the leading diagnosis, and the three highest-scoring classes are shown as
   alternatives.

The Space source defines optional horizontal-flip test-time augmentation (TTA):
it can score both the original and mirrored image and average the outputs.
**TTA is disabled in the current Space configuration** (`USE_TTA = False`), so
the current app should not be described as using it.

## Training and evaluation information

The hosted Space describes the model as fine-tuned on a combined dataset of
approximately 54,000 PlantVillage laboratory leaf photos and 2,000 PlantDoc
real-world photos. Its page says training also included compositing laboratory
leaf images onto real garden backgrounds. Training code and notebooks belong
to the upstream model project; this repository does not implement or reproduce
those training steps.

The upstream Space reports:

- **93.7%** accuracy on 190 held-out laboratory images.
- **60.6%** accuracy on 236 held-out real-world PlantDoc images (rounded to
  61% on its page).
- **87%** top-three accuracy on that real-world set.

These are figures reported by the upstream project, not results independently
measured by this web application. The smaller evaluation sets and the gap
between laboratory and real-world performance should be kept in mind when
interpreting a prediction.

## Confidence, status, and limitations

- The hosted Space uses a 50% confidence threshold: below it, the model reports
  that it is unsure instead of presenting a confident disease diagnosis.
- The default Space formats confidence as an integer percentage. The app
  therefore labels those displayed scores as approximate; a displayed `0%`
  can represent a small nonzero value rounded down.
- The UI status (`Likely healthy`, `Likely infected`, or `Uncertain`) is a
  classification summary, not a clinical certainty.
- The model does not return a disease severity estimate, so the application
  does not display one.
- The hosted API returns report HTML and does not expose the model's internal
  feature maps or gradients. Consequently, this integration cannot generate a
  valid Grad-CAM map; the UI explicitly says the attention map is unavailable.

## Privacy and operational limits

- The browser and API each apply a 5 MB upload limit. The hosted Space also
  checks images against its 25-megapixel limit.
- The upload UI informs users that images are sent to a hosted AI service.
- The hosted Space states that uploaded photos are not retained for predictions
  and are automatically deleted from its cache within one hour. This behavior
  is controlled by the remote Space, not by this repository.
- The primary model is a third-party hosted service and can be unavailable or
  change independently of this application's source code.

## References

- [Primary hosted Space](https://huggingface.co/spaces/ERN-low/plant-disease-detector)
- [Primary Space application source](https://huggingface.co/spaces/ERN-low/plant-disease-detector/raw/main/app.py)
- [Upstream model and training project](https://github.com/ern352/plant-disease-detector)
- [Optional Inference API model](https://huggingface.co/surgeonwz/plant-village)
- [Next.js App Router documentation](https://nextjs.org/docs/app)
