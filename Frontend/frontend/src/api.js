// frontend/src/api.js
import axios from 'axios';
import { ACCESS_TOKEN } from './token'; // Key for JWT in localStorage

// Base URLs
const localDjangoApiBaseUrl = 'http://localhost:8000/';
const choreoApiUrl = '/choreo-apis/awbo/backend/rest-api-be2/v1.0/';

// Determine and normalize API base URL to always end with `/`
const API_BASE_URL = (import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL 
    : localDjangoApiBaseUrl).replace(/\/?$/, '/');

// Axios instance for JSON requests (uses interceptors)
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically inject tokens into most requests
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem(ACCESS_TOKEN);
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        const googleAccessToken = localStorage.getItem("GOOGLE_ACCESS_TOKEN");
        if (googleAccessToken) {
            config.headers["X-Google-Access-Token"] = googleAccessToken;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// --------------------------------
// Resume Processor Upload Endpoints (multipart)
// --------------------------------

api.uploadJobRequirement = (file) => {
    const formData = new FormData();
    formData.append('pdf_file', file);

    const accessToken = localStorage.getItem(ACCESS_TOKEN);

    return axios.post(`${API_BASE_URL}api/resume-processor/upload-requirements/`, formData, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
};

api.uploadResumeBatch = (jobRequirementId, file) => {
    const formData = new FormData();
    formData.append('zip_file', file);
    formData.append('job_requirement', jobRequirementId);

    const accessToken = localStorage.getItem(ACCESS_TOKEN);

    return axios.post(`${API_BASE_URL}api/resume-processor/upload-resumes/`, formData, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
};

// --------------------------------
// Resume Processor JSON endpoints
// --------------------------------
api.getJobRequirementStatus = (id) =>
    api.get(`api/resume-processor/requirements/${id}/status/`);

api.getResumeBatchStatus = (id) =>
    api.get(`api/resume-processor/batches/${id}/status/`);

api.getRankedResumes = (batchId,page=1) =>
    api.get(`api/resume-processor/batches/${batchId}/ranked-resumes/?page=${page}`);

api.getCeleryTaskStatus = (taskId) =>
    api.get(`api/resume-processor/tasks/${taskId}/status/`);

api.getMyRequirements = () =>
    api.get('api/resume-processor/my-requirements/');

api.getMyBatches = () =>
    api.get('api/resume-processor/my-batches/');

// ------------------------------
// Login / Signup / Google Auth (unchanged)
// ------------------------------
// These continue using interceptors and localStorage

// Export configured Axios instance
export default api;
