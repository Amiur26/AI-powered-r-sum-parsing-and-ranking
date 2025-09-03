# backend/resume_processor/llm_utils.py
import os
import json
import fitz
import openai
import asyncio
import tempfile
import shutil
from django.conf import settings # Import Django settings to get GROQ_API_KEY etc.

# Initialize OpenAI client with settings from Django
client = openai.AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url=settings.GROQ_BASE_URL
)

LLM_PROVIDER = "groq_llama3" # As per your original main.py
MIN_TEXT_LENGTH_FOR_LLM = settings.MIN_TEXT_LENGTH_FOR_LLM # From settings.py

import fitz  # PyMuPDF
...
def extract_text_from_pdf(pdf_path):
    text_content = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                page_text = page.get_text()
                if page_text:
                    text_content += page_text + "\n"
        return text_content.strip()
    except Exception as e:
        print(f"Error extracting text from {pdf_path}: {e}")
        return None


async def get_llm_response(prompt_text):
    """
    Sends a prompt to the LLM and returns the JSON response.
    """
    response_content = None # Initialize to None
    try:
        messages = [{"role": "user", "content": prompt_text}]
        completion = await client.chat.completions.create(
            model=settings.GROQ_MODEL_NAME,
            messages=messages,
            response_format={"type": "json_object"}, # Ensure JSON response
            temperature=0.1,
        )
        response_content = completion.choices[0].message.content
        # print(f"DEBUG: Raw LLM Response: {response_content[:1000]}...") # For debugging LLM output
        return json.loads(response_content)
    except json.JSONDecodeError as json_e:
        print(f"JSON Decode Error from LLM: {json_e}")
        print(f"LLM Raw Response (possibly invalid JSON): {response_content[:500] if response_content else 'None'}...")
        return None
    except openai.APIConnectionError as e:
        print(f"API connection error: {e}")
        return None
    except openai.RateLimitError as e:
        print(f"Rate Limit Exceeded: {e}")
        return None
    except openai.APIStatusError as e:
        print(f"API status error (Code: {e.status_code}): {e.response.text if hasattr(e.response, 'text') else e.response}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred interacting with the LLM: {e}")
        return None

async def extract_job_title_from_jd(jd_text):
    """
    Extracts the main Job Title from job description text using LLM.
    """
    prompt = f"""
You are an expert at parsing job descriptions. Your task is to extract only the
main Job Title from the following job description text.
Return your response as a single JSON object with a key "JobTitle".
**Example Output:**
{{"JobTitle": "Senior Software Engineer"}}
**Job Description Text:**
{jd_text}
"""
    print("Extracting job title from job description...")
    llm_response = await get_llm_response(prompt)
    if llm_response and isinstance(llm_response, dict) and "JobTitle" in llm_response:
        return llm_response["JobTitle"].strip()
    else:
        print("Warning: Could not extract Job Title from JD PDF. Response was not as expected.")
        return None

async def process_resume_with_llm(resume_raw_text, job_description, job_title):
    """
    Processes a single resume against a job description using LLM for extraction and ranking.
    """
    if not resume_raw_text:
        return None

    combined_prompt = f"""
You are an expert HR and recruitment assistant. Your task is to:
1. Extract key candidate information from the provided resume.
2. Compare the candidate's extracted information and the full resume text against
the given job description and job title.
3. Provide a compatibility score and strengths.

Instructions for Output:
Return your entire response as a single JSON object. The JSON object MUST have two
top-level keys: "extracted_info" and "ranking_analysis".

**Schema for "extracted_info":**
{{
"Name": "Candidate's full name (string)",
"Email": "Candidate's email address (string)",
"Phone": "Candidate's phone number, including country code if present (string)",
"Location": "Candidate's city, state, and/or country (string)",
"JobTitles": ["List of all job titles held (array of strings)"],
"Companies": ["List of all companies worked at (array of strings)"],
"YearsOfExperience": "Total years of professional experience as a string (e.g.,
'5+ years', '2015-Present'). Infer if not explicit.",
"Skills": ["List of key technical, soft, and domain-specific skills (array of
strings)"],
"Degree":  "List of all degrees obtained (array of strings, e.g., 'Master of
Science, B.S. Computer Engineering')",
"GraduationYears": ["List of all graduation years or degree date ranges (array of
strings, e.g., '2017', '2012-2016')"],
"EducationalInstitutions": ["List of all universities, colleges, or other educational institutions attended (array of strings)"]

}}

**Schema for "ranking_analysis":**
{{
"CompatibilityScore": "Integer from 0 to 100, where 100 is a perfect match.
Score based on direct relevance and depth of matching skills, experience, and
qualifications from the resume to the job description and job title.
Prioritize hard technical skills and direct experience mentioned in the job
description.
If a candidate is a very strong match, score 90-100. Good match, 70-89. Moderate
match, 50-69. Low match, 0-49.",
"Strengths": ["List of 3 to 5 most relevant and specific strengths from the
resume that clearly align with the job description's requirements. Only list what is
explicitly supported by the resume text."]
}}

**Job Title:** {job_title}
**Job Description:**
{job_description}
**Candidate Resume (RAW TEXT from PDF):**
{resume_raw_text}
"""
    full_llm_response = await get_llm_response(combined_prompt)
    return full_llm_response

async def process_single_resume_wrapper(pdf_path, job_description, job_title):
    """
    Wrapper to extract text and then process a single resume with LLM.
    Handles errors and returns a structured dictionary with top-level score, name, email.
    """
    try:
        raw_text = extract_text_from_pdf(pdf_path)

        if raw_text is None or not raw_text.strip():
            print(f"Skipping {os.path.basename(pdf_path)}: Failed to extract raw text or extracted text is empty.")
            return {
                "file_name": os.path.basename(pdf_path),
                "status": "failed_extraction",
                "extracted_info": {},
                "ranking_analysis": {"CompatibilityScore": 0, "Strengths": []},
                "compatibility_score": 0, # Default to 0
                "candidate_name": "N/A",  # Default to N/A
                "candidate_email": "N/A"  # Default to N/A
            }

        if len(raw_text) < MIN_TEXT_LENGTH_FOR_LLM:
            print(f"Skipping {os.path.basename(pdf_path)}: Raw text is too short or empty after basic stripping.")
            return {
                "file_name": os.path.basename(pdf_path),
                "status": "text_too_short",
                "extracted_info": {},
                "ranking_analysis": {"CompatibilityScore": 0, "Strengths": []},
                "compatibility_score": 0, # Default to 0
                "candidate_name": "N/A",  # Default to N/A
                "candidate_email": "N/A"  # Default to N/A
            }

        print(f"Processing ranking for: {os.path.basename(pdf_path)}")
        llm_results = await process_resume_with_llm(raw_text, job_description, job_title)

        extracted_info = llm_results.get("extracted_info", {}) if llm_results else {}
        ranking_analysis = llm_results.get("ranking_analysis", {}) if llm_results else {}

        # Extract compatibility score, candidate name, and email
        compatibility_score = ranking_analysis.get("CompatibilityScore", 0)
        candidate_name = extracted_info.get("Name", "N/A")
        candidate_email = extracted_info.get("Email", "N/A")

        # Ensure compatibility_score is an integer
        try:
            compatibility_score = int(compatibility_score)
        except (ValueError, TypeError):
            compatibility_score = 0 # Default if conversion fails

        if llm_results:
            return {
                "file_name": os.path.basename(pdf_path),
                "status": "ranked",
                "extracted_info": extracted_info,
                "ranking_analysis": ranking_analysis,
                "compatibility_score": compatibility_score, # Now a top-level key
                "candidate_name": candidate_name,          # Now a top-level key
                "candidate_email": candidate_email         # Now a top-level key
            }
        else:
            return {
                "file_name": os.path.basename(pdf_path),
                "status": "failed_ranking",
                "extracted_info": extracted_info, # Still include what might have been extracted
                "ranking_analysis": ranking_analysis, # Still include what might have been extracted
                "compatibility_score": 0,
                "candidate_name": candidate_name,
                "candidate_email": candidate_email
            }
    except Exception as e:
        print(f"An unexpected error processing {os.path.basename(pdf_path)}: {e}")
        return {
            "file_name": os.path.basename(pdf_path),
            "status": f"Error: {e}",
            "extracted_info": {},
            "ranking_analysis": {"CompatibilityScore": 0, "Strengths": []},
            "compatibility_score": 0,
            "candidate_name": "N/A",
            "candidate_email": "N/A"
        }

