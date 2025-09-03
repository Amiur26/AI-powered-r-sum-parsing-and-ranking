# backend/resume_processor/tasks.py
import os
import json
import asyncio
import zipfile
import tempfile
import shutil

from celery import shared_task
from django.conf import settings
from django.db import transaction

from .models import JobRequirement, ResumeBatch, RankedResume
from .llm_utils import extract_text_from_pdf, extract_job_title_from_jd, process_single_resume_wrapper

# Helper to run async functions in a synchronous context, ensuring a new event loop
def run_async_in_sync(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError: # No current event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    # If the loop is already running (e.g., in a test runner or another async context),
    # we can't just run_until_complete. This is less likely in a solo Celery worker,
    # but good to be robust.
    if loop.is_running():
        pass # The direct loop.run_until_complete() below handles creating/closing.

    return loop.run_until_complete(coro)


# Task to process a single Job Requirement PDF
@shared_task(bind=True)
def process_job_requirement_pdf(self, job_requirement_id):
    try:
        job_requirement = JobRequirement.objects.get(id=job_requirement_id)
        job_requirement.status = 'processing_jd'
        job_requirement.processing_task_id = self.request.id
        job_requirement.save()

        pdf_path = job_requirement.pdf_file.path
        jd_text = extract_text_from_pdf(pdf_path)

        if not jd_text:
            job_requirement.status = 'failed_jd'
            job_requirement.save()
            return {'status': 'error', 'message': 'Failed to extract text from JD PDF.'}

        # Use the helper to run the async LLM call
        job_title = run_async_in_sync(extract_job_title_from_jd(jd_text))
        
        if not job_title:
            job_title = "Unknown Job Title"

        job_requirement.description_text = jd_text
        job_requirement.title = job_title
        job_requirement.status = 'processed_jd'
        job_requirement.save()

        return {
            'status': 'success',
            'job_requirement_id': job_requirement.id,
            'job_title': job_title,
            'description_text_length': len(jd_text)
        }

    except JobRequirement.DoesNotExist:
        return {'status': 'error', 'message': f'JobRequirement with ID {job_requirement_id} not found.'}
    except Exception as e:
        # Re-fetch in case of error to ensure latest state
        job_requirement = JobRequirement.objects.get(id=job_requirement_id)
        job_requirement.status = 'failed_jd'
        job_requirement.save()
        return {'status': 'error', 'message': f'An unexpected error occurred: {e}'}

# Task to process a batch of resumes from a ZIP file
@shared_task(bind=True)
def process_resume_batch_zip(self, resume_batch_id):
    temp_dir = None
    try:
        resume_batch = ResumeBatch.objects.get(id=resume_batch_id)
        job_requirement = resume_batch.job_requirement

        if job_requirement.status != 'processed_jd' or not job_requirement.description_text:
            return {'status': 'error', 'message': 'Job Description not yet processed or missing text.'}

        resume_batch.status = 'extracting'
        resume_batch.processing_task_id = self.request.id
        resume_batch.save()

        zip_path = resume_batch.zip_file.path
        temp_dir = tempfile.mkdtemp()
        extracted_pdf_paths = []

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            pdf_in_zip = [f for f in zip_ref.namelist() if f.lower().endswith('.pdf') and not f.startswith('__MACOSX/')]

            if not pdf_in_zip:
                resume_batch.status = 'failed'
                resume_batch.save()
                return {'status': 'error', 'message': 'No PDF files found in the ZIP archive.'}

            for pdf_name in pdf_in_zip:
                extracted_path = os.path.join(temp_dir, os.path.basename(pdf_name))
                with open(extracted_path, "wb") as outfile:
                    outfile.write(zip_ref.read(pdf_name))
                extracted_pdf_paths.append(extracted_path)

        resume_batch.status = 'processing'
        resume_batch.save()

        tasks = [
            process_single_resume_wrapper(
                pdf_path,
                job_requirement.description_text,
                job_requirement.title
            ) for pdf_path in extracted_pdf_paths
        ]

        # Use the helper to run all async LLM calls
        processed_results = run_async_in_sync(asyncio.gather(*tasks))

        with transaction.atomic():
            for result in processed_results:
                RankedResume.objects.create(
                    resume_batch=resume_batch,
                    file_name=result.get('file_name', 'unknown_file.pdf'),
                    status=result.get('status', 'failed_ranking'),
                    extracted_info=result.get('extracted_info', {}),
                    ranking_analysis=result.get('ranking_analysis', {}),
                    # NOW CORRECTLY ACCESSING TOP-LEVEL KEYS
                    compatibility_score=result.get('compatibility_score', 0),
                    candidate_name=result.get('candidate_name', 'N/A'),
                    candidate_email=result.get('candidate_email', 'N/A')
                )
        
        resume_batch.status = 'completed'
        resume_batch.save()
        return {'status': 'success', 'resume_batch_id': resume_batch.id, 'processed_count': len(processed_results)}

    except ResumeBatch.DoesNotExist:
        return {'status': 'error', 'message': f'ResumeBatch with ID {resume_batch_id} not found.'}
    except JobRequirement.DoesNotExist:
        return {'status': 'error', 'message': f'JobRequirement for ResumeBatch {resume_batch_id} not found.'}
    except zipfile.BadZipFile:
        resume_batch = ResumeBatch.objects.get(id=resume_batch_id)
        resume_batch.status = 'failed'
        resume_batch.save()
        return {'status': 'error', 'message': 'Uploaded file is not a valid ZIP file or is corrupted.'}
    except Exception as e:
        # Catch any other unexpected errors during batch processing
        resume_batch = ResumeBatch.objects.get(id=resume_batch_id)
        resume_batch.status = 'failed'
        resume_batch.save()
        return {'status': 'error', 'message': f'An unexpected error occurred during batch processing: {e}'}
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

