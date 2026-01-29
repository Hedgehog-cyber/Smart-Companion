# **App Name**: Smart Companion

## Core Features:

- Task Input: Central text input field for users to enter overwhelming tasks.
- Micro-Win Generation: Use AI to generate 5-7 actionable 'Micro-Win' steps from the main task using a large language model (LLM) tool.
- Step Display with Checkboxes: Display each micro-win step with a checkbox. Completed steps turn green.
- Breakdown Button: A 'Break this down further' button next to each step for more granular sub-steps.
- Data Persistence: Use IndexedDB to save the current task list and micro-win steps locally in the browser, preserving data privacy.
- Step Reset: Add logic that removes completed tasks from IndexedDB.

## Style Guidelines:

- Primary color: Soft blue (#A0D2EB) to evoke calmness and focus.
- Background color: Off-white (#F8F8FF) to minimize distraction.
- Accent color: Muted violet (#B39DDB) for interactive elements and highlights.
- Body and headline font: 'PT Sans', a modern and readable sans-serif font suitable for both headlines and body text, promoting readability.
- Centered layout with a large, prominent input box.
- Use very subtle animations (e.g., a gentle fade) when updating task status.