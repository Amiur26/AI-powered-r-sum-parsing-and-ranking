from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser # For file uploads
from rest_framework.views import APIView # Make sure this is the only 'View' import
from api.utils import audit
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django_celery_results.models import TaskResult # To check task status from DB
from celery.result import AsyncResult # To get task status directly from Celery

from api.utils import audit, scan_file

from .models import JobRequirement, ResumeBatch, RankedResume
from .serializers import JobRequirementSerializer, ResumeBatchSerializer, RankedResumeSerializer, TaskStatusSerializer
from .tasks import process_job_requirement_pdf, process_resume_batch_zip # Import your Celery tasks

class JobRequirementUploadView(generics.CreateAPIView):
   
    queryset = JobRequirement.objects.all()
    serializer_class = JobRequirementSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] # Allow file uploads

    def perform_create(self, serializer):
        # Save the JobRequirement instance, linking it to the current user
        job_requirement = serializer.save(user=self.request.user)
        
        # 🔒 AV scan (PDF) — skipped if ENABLE_AV_SCAN is False
        pdf_path = getattr(job_requirement, "pdf_file", None)
        pdf_path = pdf_path.path if pdf_path else None
        if pdf_path:
            ok, scan_status = scan_file(pdf_path)
            if not ok:
                job_requirement.delete()
                raise serializers.ValidationError({"detail": f"Upload blocked by AV scan: {scan_status}"})
        
        task = process_job_requirement_pdf.delay(job_requirement.id)
        job_requirement.processing_task_id = task.id
        job_requirement.save()
        
        audit(
            self.request.user, "UPLOAD_JD",
            job_requirement_id=job_requirement.id,
            filename=getattr(job_requirement, "pdf_file", None) and job_requirement.pdf_file.name,
            task_id=task.id
        )

    
class ResumeBatchUploadView(generics.CreateAPIView):
    
    queryset = ResumeBatch.objects.all()
    serializer_class = ResumeBatchSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] # Allow file uploads

    def perform_create(self, serializer):
        # Ensure job_requirement_id is provided and valid
        job_requirement_id = self.request.data.get('job_requirement')
        if not job_requirement_id:
            raise serializers.ValidationError({"job_requirement": "This field is required."})
        
        try:
            job_requirement = JobRequirement.objects.get(id=job_requirement_id, user=self.request.user)
        except JobRequirement.DoesNotExist:
            raise serializers.ValidationError({"job_requirement": "Job Requirement not found or does not belong to user."})

        # Save the ResumeBatch instance, linking it to the current user and job requirement
        resume_batch = serializer.save(user=self.request.user, job_requirement=job_requirement)
        
         # 🔒 AV scan (ZIP)
        zip_path = getattr(resume_batch, "zip_file", None)
        zip_path = zip_path.path if zip_path else None
        if zip_path:
            ok, status = scan_file(zip_path)
            if not ok:
                resume_batch.delete()
                raise serializers.ValidationError({"detail": f"Upload blocked by AV scan: {status}"})
        
        # Trigger the Celery task to process the resumes
        task = process_resume_batch_zip.delay(resume_batch.id)
        
        # Update the ResumeBatch with the task ID
        resume_batch.processing_task_id = task.id
        resume_batch.save()
    
        audit(
            self.request.user, "UPLOAD_ZIP",
            resume_batch_id=resume_batch.id,
            job_requirement_id=job_requirement.id,
            filename=getattr(resume_batch, "zip_file", None) and resume_batch.zip_file.name,
            task_id=task.id
        )


class JobRequirementStatusView(generics.RetrieveAPIView):
    """
    API endpoint to get the status of a specific Job Requirement processing.
    """
    queryset = JobRequirement.objects.all()
    serializer_class = JobRequirementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class ResumeBatchStatusView(generics.RetrieveAPIView):
    """
    API endpoint to get the status of a specific Resume Batch processing.
    """
    queryset = ResumeBatch.objects.all()
    serializer_class = ResumeBatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class RankedResumesListView(generics.ListAPIView):
    """
    API endpoint to list ranked resumes for a specific Resume Batch.
    Ordered by compatibility score descending.
    """
    serializer_class = RankedResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        resume_batch_id = self.kwargs['batch_id']
        # Ensure the batch belongs to the current user
        resume_batch = get_object_or_404(ResumeBatch, id=resume_batch_id, user=self.request.user)
        return RankedResume.objects.filter(resume_batch=resume_batch).order_by('-compatibility_score')
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        resume_batch_id = kwargs['batch_id']
        returned = 0
        # DRF PageNumberPagination returns {"count":..,"next":..,"previous":..,"results":[...]}
        if isinstance(response.data, dict) and "results" in response.data:
            returned = len(response.data["results"])
        else:
            returned = len(response.data)
        audit(request.user, "VIEW_RANKED_LIST", resume_batch_id=resume_batch_id, returned=returned)
        return response


class UserJobRequirementsList(generics.ListAPIView):
    """
    API endpoint to list all job requirements uploaded by the current user.
    """
    serializer_class = JobRequirementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobRequirement.objects.filter(user=self.request.user).order_by('-uploaded_at')

class UserResumeBatchesList(generics.ListAPIView):
    """
    API endpoint to list all resume batches uploaded by the current user.
    """
    serializer_class = ResumeBatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ResumeBatch.objects.filter(user=self.request.user).order_by('-uploaded_at')

class CeleryTaskStatusView(APIView):
    """
    API endpoint to get the status and result of any Celery task by ID.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id, format=None):
        task = AsyncResult(task_id)
        response_data = {
            'task_id': task.id,
            'status': task.status,
            'ready': task.ready(),
            'successful': task.successful(),
            'failed': task.failed(),
        }
        if task.ready():
            response_data['result'] = task.result
        return Response(response_data)

