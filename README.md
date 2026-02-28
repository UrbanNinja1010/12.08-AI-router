# AI Prompt Router

A beautiful, vanilla JavaScript utility tool that takes your prompt, analyzes it, and intelligently routes you to the optimal AI assistant (Claude, Gemini, ChatGPT, or Grok) with a single click. No backend, no frameworks, just an elegant single-page application.

## Features

- **Intelligent Routing**: Determines the best provider based on keyword matching logic.
- **Smart Tie-breakers & Fallbacks**: Uses domain-specific logic to break ties. (e.g. Code/Architecture to Claude, Live documents to Gemini).
- **Secondary Recommendations**: If the top two models are close in score, the tool suggests the runner-up as well.
- **Customizable Rules**: Settings menu allows user to redefine the keywords triggering each AI. Persists in your local browser storage.
- **Fast Keyboard Shortcuts**: 
  - `Shift + Enter` to newline
  - `Enter` once to analyze, `Enter` again to jump directly to the browser view of the AI
  - `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows/Linux) to instantly analyze and jump to the AI provider.
- **History Tracking**: Keeps a history of your 5 most recent routing requests.
- **Auto-Copy to Clipboard**: Whenever a provider is launched, the initial prompt is automatically copied to your clipboard to paste immediately.

## Configuration & Logic
The logic works by assigning weights to prompts based on certain categories of keywords:

**Claude:** Best for coding, debugging, software architecture, technical documentation, complex reasoning, and long-form essays.
**Gemini:** Best for research, parsing large PDFs/documents, finding academic sources, and Google workspace tasks.
**Grok:** Best for real-time news, trending social media, Twitter/X sentiment, and pop culture.
**ChatGPT:** Best for versatile brainstorming, personal advice, business strategy, and multimodal image generation.

If you don't like the defaults, simply click the Settings (gear) icon in the top right of the application to update and save your own keywords!

## Technical Setup

Because this requires no build pipeline and uses zero external libraries, to run the application you only need to open the `index.html` file in your preferred web browser.

## File Structure

- `index.html`: Main HTML skeletal structure and UI.
- `styles.css`: All application styling (dark theme + glassmorphism + responsive grid).
- `script.js`: Prompt analysis engine, routing, tie-breaker logic, local storage logic, and history controls.
