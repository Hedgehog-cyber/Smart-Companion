# Smart Companion

Smart Companion is a neuro-inclusive executive function coach designed to help users overcome task paralysis. It uses Generative AI to break down overwhelming goals into manageable, low-friction "micro-wins," tailored to each user's specific neuro-profile.

##  Core Philosophy

- **Micro-Wins:** Large tasks are intimidating. We break them into physical, actionable steps that take only a few minutes.
- **Neuro-Inclusive:** Built with ADHD and neurodivergence in mind. Features like customizable granularity help users who struggle with traditional productivity tools.
- **Privacy-First:** User data, preferences, and task history are stored locally on your device. We use PII masking to ensure sensitive information never reaches the AI models.

##  Key Features

- **AI Task Breakdown:** Instantly convert a vague goal into a step-by-step plan.
- **"Still Too Hard?" (Recursive Breakdown):** Stuck on a step? The AI can break any individual step into even smaller sub-steps.
- **Individualized Neuro-Profiles:** Define your granularity needs, sensory triggers, and preferred support style. The AI adapts its persona and output to match.
- **Streaming Responses:** Near-instant feedback (<5s latency) using streaming AI generation.
- **PII Masking:** Automatic detection and replacement of names, locations, and contact info before data leaves your device.
- **Voice Input:** Use the built-in microphone to dictate your tasks.
- **Task History:** Archive completed tasks and track your progress over time.

##  Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **AI Engine:** [Genkit](https://firebase.google.com/docs/genkit) with [Google Gemini](https://ai.google.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [ShadCN UI](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Storage:** Local-first (localStorage) for user data and privacy.
- **Language:** [TypeScript](https://www.typescriptlang.org/)

##  Project Structure

```text
src/
├── ai/                 # Genkit flows and AI configuration
│   ├── flows/          # AI logic for task breakdown and refinement
│   └── genkit.ts       # Genkit initialization
├── app/                # Next.js App Router pages and layouts
├── components/         # React components (UI and specialized)
│   ├── ui/             # ShadCN UI primitive components
│   └── ...             # Feature-specific components (TaskInput, TaskDisplay)
├── firebase/           # Firebase client SDK initialization and hooks
├── lib/                # Shared utilities, types, and sound effects
└── hooks/              # Custom React hooks (toast, mobile detection)
```

## Getting Started

### Local Development

First, install the dependencies:

```bash
npm install
```

Second, set up your environment variables:
Create a `.env` file with your `GOOGLE_GENAI_API_KEY`.

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Docker

You can also run Smart Companion as a containerized application.

### Build the Image

Run the following command in the project root:

```bash
docker build -t smart-companion .
```

### Run the Container

Start the container and map the internal port (3000) to a host port. Ensure you pass your environment variables:

```bash
docker run -p 3000:3000 --env-file .env smart-companion
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

## Privacy & Safety

Smart Companion is designed to be a safe space.
1. **Masking:** Before your task is sent to the LLM, names are replaced with `[NAME]`, addresses with `[LOCATION]`, and contact info with `[CONTACT]`.
2. **Local Storage:** Your "Neuro-Profile" and task history never leave your browser.
3. **Safety Settings:** AI generation is configured with strict safety thresholds to prevent harmful content.

---
