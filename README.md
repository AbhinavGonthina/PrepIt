# PrepIt

AI-powered interview prep. Give PrepIt a company name, your resume, and a job description, and it generates a personalized prep report using a [Subconscious](https://subconscious.dev) AI agent with live web search.

## What you get

Each report has five sections:

| Section | What it covers |
| --- | --- |
| 🏢 **Company Intel** | Recent news, culture, and what to know before you walk in |
| 📋 **Resume Alignment** | Where your experience matches the role, and the gaps an interviewer might probe |
| 💬 **Likely Interview Questions** | Role-specific technical and behavioral questions |
| 🎯 **Talking Points** | What to highlight from your resume for this company |
| 🚩 **Red Flags** | Potential concerns and how to address them |

## Tech stack

- **Frontend:** React (Create React App)
- **Backend:** Python, Flask, PyPDF2 for resume PDF parsing
- **AI:** Subconscious API (`tim` engine) with the `parallel_search` web search tool

## Project structure

```
frontend/        React app (UI, report rendering)
PrepIt/api.py    Flask backend: /parse-pdf and /analyze endpoints
PrepIt/cli.py    Command-line version of the same prep report
PrepIt/job.txt   Sample job description
```

## Running locally

### Prerequisites

- Python 3.9+
- Node.js 18+
- A Subconscious API key ([get one here](https://www.subconscious.dev/platform))

### 1. Backend

```bash
cd PrepIt
pip install flask flask-cors python-dotenv subconscious-sdk PyPDF2
```

Create `PrepIt/.env`:

```
SUBCONSCIOUS_API_KEY=your-api-key-here
```

Start the server (runs on http://127.0.0.1:5000):

```bash
python api.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000.

### Demo mode

To try the UI without an API key, start the backend with `DEMO_MODE=1`. The `/analyze` endpoint then returns a sample report instead of calling the Subconscious API.

```bash
DEMO_MODE=1 python api.py
```

## CLI

PrepIt also runs from the terminal:

```bash
cd PrepIt
pip install typer rich
python cli.py --company "Google" --resume path/to/resume.txt --job job.txt
```
