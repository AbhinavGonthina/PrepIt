from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
from subconscious import Subconscious
import os
import PyPDF2
import io

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/parse-pdf", methods=["POST"])
def parse_pdf():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file provided"}), 400
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return jsonify({"text": text.strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    resume = data.get("resume")
    job_description = data.get("jobDescription")
    company = data.get("company")

    if not all([resume, job_description, company]):
        return jsonify({"error": "Missing required fields"}), 400

    api_key = os.getenv("SUBCONSCIOUS_API_KEY")
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

    Format your response with clear section headers and plain text. No markdown or LaTeX.
    """

    def generate():
        stream_agent_response = client.stream(
            engine="tim",
            input={
                "instructions": instructions,
                "tools": [{"type": "platform", "id": "parallel_search", "options": {}}]
            }
        )
        for event in stream_agent_response:
            print("EVENT:", event)  # debug log
            try:
                if hasattr(event, "content") and event.content:
                    yield event.content
                elif hasattr(event, "text") and event.text:
                    yield event.text
                elif hasattr(event, "answer") and event.answer:
                    yield event.answer
            except Exception as e:
                print("Stream error:", e)

    return Response(stream_with_context(generate()), mimetype="text/plain")

if __name__ == "__main__":
    app.run(debug=True, port=5000)