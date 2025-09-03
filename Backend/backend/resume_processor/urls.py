# backend/resume_processor/urls.py
from django.urls import path
# IMPORTANT: Ensure ONLY these specific view classes are imported.
# A 'from .views import *' or importing a generic 'View' class elsewhere
# could cause the issue you're seeing.
from .views import (
    JobRequirementUploadView,
    ResumeBatchUploadView,
    JobRequirementStatusView,
    ResumeBatchStatusView,
    RankedResumesListView,
    UserJobRequirementsList,
    UserResumeBatchesList,
    CeleryTaskStatusView,
)

urlpatterns = [
    # File Upload Endpoints
    path('upload-requirements/', JobRequirementUploadView.as_view(), name='upload_requirements'),
    path('upload-resumes/', ResumeBatchUploadView.as_view(), name='upload_resumes'),

    # Status Check Endpoints
    path('requirements/<int:pk>/status/', JobRequirementStatusView.as_view(), name='requirements_status'),
    path('batches/<int:pk>/status/', ResumeBatchStatusView.as_view(), name='batch_status'),
    path('tasks/<str:task_id>/status/', CeleryTaskStatusView.as_view(), name='celery_task_status'),

    # Results Endpoints
    path('batches/<int:batch_id>/ranked-resumes/', RankedResumesListView.as_view(), name='ranked_resumes_list'),

    # List Endpoints for User's History
    path('my-requirements/', UserJobRequirementsList.as_view(), name='my_requirements'),
    path('my-batches/', UserResumeBatchesList.as_view(), name='my_batches'),
]