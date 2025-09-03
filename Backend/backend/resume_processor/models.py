from django.db import models

# Create your models here.
# backend/resume_processor/models.py
from django.db import models
from django.conf import settings # Import settings to reference AUTH_USER_MODEL

class JobRequirement(models.Model):
    """
    Stores information about an uploaded HR job requirement PDF.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_requirements'
    )
    title = models.CharField(max_length=255, blank=True, null=True, help_text="Extracted or manually entered job title")
    description_text = models.TextField(blank=True, null=True, help_text="Extracted text from the PDF")
    pdf_file = models.FileField(upload_to='requirements_pdfs/', help_text="The original uploaded PDF file")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Status of the processing for this requirement
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('processing_jd', 'Processing Job Description'),
        ('processed_jd', 'Job Description Processed'),
        ('failed_jd', 'Job Description Processing Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    
    # Store task ID if processing is asynchronous
    processing_task_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"JD for {self.title or 'N/A'} by {self.user.username} ({self.uploaded_at.strftime('%Y-%m-%d')})"

class ResumeBatch(models.Model):
    """
    Stores information about an uploaded ZIP file containing multiple resumes.
    Each batch is linked to a specific JobRequirement.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resume_batches'
    )
    job_requirement = models.ForeignKey(
        JobRequirement,
        on_delete=models.CASCADE,
        related_name='resume_batches'
    )
    zip_file = models.FileField(upload_to='resume_zips/', help_text="The original uploaded ZIP file")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Status of the batch processing
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('extracting', 'Extracting Resumes'),
        ('processing', 'Processing Resumes'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    
    # Celery task ID for the batch processing
    processing_task_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Resume Batch for {self.job_requirement.title or 'N/A'} by {self.user.username} ({self.uploaded_at.strftime('%Y-%m-%d')})"

class RankedResume(models.Model):
    """
    Stores the extracted information and ranking analysis for each resume
    within a ResumeBatch.
    """
    resume_batch = models.ForeignKey(
        ResumeBatch,
        on_delete=models.CASCADE,
        related_name='ranked_resumes'
    )
    file_name = models.CharField(max_length=255, help_text="Original filename of the resume PDF")
    
    # Status of individual resume processing
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('extracted', 'Text Extracted'),
        ('ranked', 'Ranked Successfully'),
        ('failed_extraction', 'Extraction Failed'),
        ('failed_ranking', 'Ranking Failed'),
        ('text_too_short', 'Text Too Short')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    extracted_info = models.JSONField(default=dict, help_text="JSON data of extracted candidate info")
    ranking_analysis = models.JSONField(default=dict, help_text="JSON data of ranking analysis")
    
    # For easier querying and sorting
    compatibility_score = models.IntegerField(default=0, help_text="Compatibility score from LLM (0-100)")
    candidate_name = models.CharField(max_length=255, blank=True, null=True)
    candidate_email = models.EmailField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-compatibility_score']
        unique_together = ('resume_batch', 'file_name')

    def __str__(self):
        return f"{self.candidate_name or self.file_name} - Score: {self.compatibility_score}"

    def save(self, *args, **kwargs):
        # Automatically populate compatibility_score and candidate_name/email from JSON
        if 'ranking_analysis' in self.ranking_analysis and isinstance(self.ranking_analysis, dict) and 'CompatibilityScore' in self.ranking_analysis:
            self.compatibility_score = self.ranking_analysis['CompatibilityScore']
        
        if 'extracted_info' in self.extracted_info and isinstance(self.extracted_info, dict):
            self.candidate_name = self.extracted_info.get('Name')
            self.candidate_email = self.extracted_info.get('Email')

        super().save(*args, **kwargs)

