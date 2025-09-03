# AI-powered Résumé Parsing and Ranking

An AI-powered system that parses job descriptions and resumes, extracts key information, and ranks candidates based on compatibility.  
This project was developed as part of the CSE499 Capstone Design Project.

---

##  Features
- **Résumé Parsing** – Extracts candidate details (name, email, phone, education, experience, skills).  
- **Job Description Analysis** – Automatically extracts job titles and requirements.  
- **Candidate Ranking** – Scores and ranks resumes against job descriptions using LLMs.  
- **Frontend (React + Tailwind)** – Modern UI with upload functionality and ranking display.  
- **Backend (Django + Celery + Redis)** – Task management, APIs, and integration with Groq LLMs.  
- **Google OAuth** – Secure authentication for users.  

---

## 🛠️ Tech Stack
- **Backend:** Django, Django REST Framework, Celery, Redis  
- **Frontend:** React, Vite, Tailwind CSS  
- **Database:** SQLite (dev) → can be replaced with PostgreSQL (prod)  
- **LLM Provider:** Groq API (LLaMA 3.1)  
- **Authentication:** JWT + Google OAuth  

---

## ⚙ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/Amiur26/AI-powered-resume-parsing-and-ranking.git
cd AI-powered-resume-parsing-and-ranking
