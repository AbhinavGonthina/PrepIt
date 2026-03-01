#!/usr/bin/env python3
"""Main CLI application."""

import os
import sys
from pathlib import Path

import typer
from dotenv import load_dotenv
from subconscious import Subconscious

from utils.errors import handle_error
from utils.streaming import StreamState, handle_stream_event, start_loading_spinner
from utils.timeout import (
    handle_keyboard_interrupt,
    handle_timeout_error,
    reset_timeout,
    timeout_context,
    TimeoutError,
)

# Load environment variables from .env file
load_dotenv()

# Add current directory to path so we can import modules directly
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

DEFAULT_TIMEOUT = 300

app = typer.Typer(
    name="prepit",
    help="AI-powered interview prep agent",
    add_completion=False,
)


def stream(resume: str, job_description: str, company: str, timeout: int = DEFAULT_TIMEOUT) -> None:
    try:
        api_key = os.getenv("SUBCONSCIOUS_API_KEY")
        if not api_key:
            handle_error(
                ValueError(
                    "API key not found. Set SUBCONSCIOUS_API_KEY environment variable "
                    "or add it to a .env file."
                ),
                "Configuration error",
            )

        client = Subconscious(api_key=api_key)

        instructions = f"""
        You are an expert interview prep assistant. Given a resume, job description, and company name, produce a detailed prep report with the following sections:

        1. COMPANY INTEL
           - Search for recent news, funding, leadership, culture, and mission of {company}
           - Note anything the candidate should know walking into the interview

        2. RESUME ALIGNMENT
           - List specific skills and experiences from the resume that match the job description
           - List any gaps or weaknesses the interviewer might probe

        3. LIKELY INTERVIEW QUESTIONS
           - Search for common interview questions for this role at {company}
           - Generate 5 role-specific technical or behavioral questions based on the job description

        4. TALKING POINTS
           - Suggest 3-5 specific things from the resume to highlight for THIS job
           - Frame them in terms of what the company cares about

        5. RED FLAGS
           - Flag anything in the resume that might raise concerns for this specific role
           - Suggest how to address them if asked

        Resume:
        {resume}

        Job Description:
        {job_description}

        Company: {company}

        IMPORTANT: Format your response for terminal display. Use plain text, section headers with dashes, and standard ASCII only. No markdown, no LaTeX.
        """

        stream_agent_response = client.stream(
            engine="tim",
            input={
                "instructions": instructions,
                "tools": [
                    {
                        "type": "platform",
                        "id": "parallel_search",
                        "options": {},
                    },
                ]
            }
        )

        state = StreamState()
        start_loading_spinner(state)

        try:
            with timeout_context(timeout):
                for event in stream_agent_response:
                    reset_timeout(timeout)
                    if not handle_stream_event(event, state):
                        break
        except TimeoutError as timeout_err:
            handle_timeout_error(timeout_err, state)
            return
        except KeyboardInterrupt:
            handle_keyboard_interrupt()
            raise
        except Exception as stream_error:
            handle_error(stream_error, "Error during streaming")

    except Exception as e:
        handle_error(e, "Streaming failed")


@app.command()
def main(
    company: str = typer.Option(..., "--company", "-c", help="Company name"),
    resume_file: str = typer.Option(..., "--resume", "-r", help="Path to resume .txt file"),
    job_file: str = typer.Option(..., "--job", "-j", help="Path to job description .txt file"),
    timeout: int = typer.Option(DEFAULT_TIMEOUT, "--timeout", "-t", help="Timeout in seconds"),
) -> None:
    """
    PrepIt - AI Interview Prep Agent

    Usage:
        python cli.py --company "Google" --resume resume.txt --job job.txt
    """
    resume = Path(resume_file).read_text()
    job_description = Path(job_file).read_text()
    stream(resume, job_description, company, timeout=timeout)


if __name__ == "__main__":
    app()