# backend/resume_processor/serializers.py
from rest_framework import serializers
from .models import JobRequirement, ResumeBatch, RankedResume
from celery.result import AsyncResult # To check Celery task status

class JobRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRequirement
        fields = ['id', 'title', 'description_text', 'pdf_file', 'uploaded_at', 'status', 'processing_task_id', 'user']
        read_only_fields = ['id', 'title', 'description_text', 'uploaded_at', 'status', 'processing_task_id', 'user']

    def validate_pdf_file(self, f):
        name = f.name.lower()
        if not name.endswith('.pdf'):
            raise serializers.ValidationError("PDF required.")
        if f.size and f.size > 15 * 1024 * 1024:
            raise serializers.ValidationError("PDF too large (>15MB).")
        return f
    
class ResumeBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeBatch
        fields = ['id', 'job_requirement', 'zip_file', 'uploaded_at', 'status', 'processing_task_id', 'user']
        read_only_fields = ['id', 'uploaded_at', 'status', 'processing_task_id', 'user']

    def validate_zip_file(self, f):
        name = f.name.lower()
        if not name.endswith('.zip'):
            raise serializers.ValidationError("ZIP required.")
        if f.size and f.size > 100 * 1024 * 1024:
            raise serializers.ValidationError("ZIP too large (>100MB).")
        return f
class RankedResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RankedResume
        fields = [
            'id', 'resume_batch', 'file_name', 'status',
            'extracted_info', 'ranking_analysis',
            'compatibility_score', 'candidate_name', 'candidate_email'
        ]
        read_only_fields = [
            'id', 'resume_batch', 'file_name', 'status',
            'extracted_info', 'ranking_analysis',
            'compatibility_score', 'candidate_name', 'candidate_email'
        ]
   

class TaskStatusSerializer(serializers.Serializer):
    """
    Serializer to check the status of a Celery task.
    """
    task_id = serializers.CharField(max_length=255)
    status = serializers.SerializerMethodField()
    result = serializers.SerializerMethodField()

    def get_status(self, obj):
        task = AsyncResult(obj['task_id'])
        return task.status

    def get_result(self, obj):
        task = AsyncResult(obj['task_id'])
        if task.ready():
            return task.result
        return None

