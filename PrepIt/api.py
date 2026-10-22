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

DEMO_REPORT = """1. COMPANY INTEL
- {company} continues to invest heavily in AI across its product lines, with generative AI features now shipping in Search, Workspace, and Cloud.
- Engineering culture emphasizes code quality, rigorous code review, and data-driven decision making. Expect interviewers to care about how you reason, not just the final answer.
- Recent leadership messaging has focused on efficiency and shipping faster, so stories about delivering ahead of schedule will resonate.
- The new grad process typically includes 2-3 coding rounds plus a Googleyness and Leadership behavioral round.

2. RESUME ALIGNMENT
- Backend API experience: designing RESTful services with Express, Prisma, and TypeScript at Quak Travel maps directly to "design and implement scalable backend services and APIs."
- Performance work: the Redis caching integration that cut query latency by up to 80% is strong evidence for working on systems at scale.
- Collaboration and leadership: leading a 4-person tooling team and coordinating 20+ contributors at Rainfall Learning shows the cross-functional skills the role asks for.
- Strong fundamentals: a 4.0 GPA with coursework in Algorithms, Systems, and Cloud Computing, plus TA experience in Discrete Structures.
- Gap: most production experience is in JavaScript/TypeScript, while the role lists Python, Java, or C++. Be ready to code fluently in one of those.
- Gap: no direct experience yet with large distributed systems or production on-call debugging.

3. LIKELY INTERVIEW QUESTIONS
- Design a URL shortener. How would you handle billions of reads per day and keep latency low?
- Given a stream of hotel search queries, how would you design a cache eviction strategy, and how would you measure whether it is working?
- Implement a function that merges overlapping time intervals (for example, booking availability windows) and analyze its complexity.
- Tell me about a time you disagreed with a teammate on a technical decision. How did you resolve it?
- Walk me through how you would debug an API endpoint that is intermittently slow in production.

4. TALKING POINTS
- Lead with the Redis caching win: quantify the 80% latency reduction and explain how you identified the bottleneck.
- Highlight delivering the Quak Travel prototype 33% ahead of schedule and its role in securing $30,000 in funding. It shows ownership and impact.
- Use the Stripe payment integration at Rainfall Learning to show you can build correct, reliable systems where mistakes cost real money.
- Mention teaching 500+ students as a TA. It demonstrates clear communication, which {company} values in code reviews and design discussions.

5. RED FLAGS
- Several roles are listed as concurrent and ongoing. An interviewer may ask how you balance them. Explain your prioritization and time management with a concrete example.
- Light on Python, Java, and C++ in production. Pick one language for interviews, practice in it consistently, and mention coursework or projects where you used it.
- Mostly startup and student-org experience. Frame it as high ownership and fast iteration, and show curiosity about operating at {company}'s scale.
"""

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

    # Set DEMO_MODE=1 to return a canned sample report without calling the API
    if os.getenv("DEMO_MODE") == "1":
        return Response(DEMO_REPORT.format(company=company), mimetype="text/plain")

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