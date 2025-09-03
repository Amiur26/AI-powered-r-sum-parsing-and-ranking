import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import '../components/ScoreCircle'
import {
  Sparkles,
  Upload,
  Files,
  FileText,
  CheckCircle2,
  Loader2,
  LineChart,
  RefreshCcw,
} from 'lucide-react';

import '../styles/About.css'; // reuse gradient + glass system
import '../styles/Dashboard.css'; // keep your existing class hooks & minor overrides
import api from '../api';
import ScoreCircle from '../components/ScoreCircle';

const Dashboard = () => {
  // --- keep all variable names and logic exactly the same ---
  const [jobRequirementId, setJobRequirementId] = useState(null);
  const [resumeBatchId, setResumeBatchId] = useState(null);
  const [processingJDStatus, setProcessingJDStatus] = useState('idle');
  const [processingResumeStatus, setProcessingResumeStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rankedResumes, setRankedResumes] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const pollingIntervalRef = useRef(null);
  const [uploadedFileNames, setUploadedFileNames] = useState({ hr: '', zip: '' });
  const hrFileInputRef = useRef(null);
  const zipFileInputRef = useRef(null);

  const uploadHRRequirementsWith = useCallback(async (file) => {
    if (!file) return;
    setProcessingJDStatus('uploading_jd');
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await api.uploadJobRequirement(file);
      setJobRequirementId(response.data.id);
      setUploadedFileNames((prev) => ({ ...prev, hr: file.name }));
      setProcessingJDStatus('processing_jd');
    } catch (error) {
      setProcessingJDStatus('error');
      setErrorMessage(error.response?.data?.detail || error.message);
    }
  }, []);

  const uploadResumesWith = useCallback(
    async (file) => {
      if (!file || !jobRequirementId) {
        setErrorMessage('Please upload HR Requirements first.');
        return;
      }
      if (
        processingResumeStatus === 'uploading_resumes' ||
        processingResumeStatus === 'processing_resumes'
      ) {
        console.warn('Resume upload already in progress. Ignoring.');
        return;
      }

      setProcessingResumeStatus('uploading_resumes');
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const response = await api.uploadResumeBatch(jobRequirementId, file);
        setResumeBatchId(response.data.id);
        setUploadedFileNames((prev) => ({ ...prev, zip: file.name }));
        setProcessingResumeStatus('processing_resumes');
      } catch (error) {
        setProcessingResumeStatus('error');
        setErrorMessage(error.response?.data?.detail || error.message);
      }
    },
    [jobRequirementId, processingResumeStatus]
  );

  const handleFileChange = useCallback(
    (type, e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (type === 'hr') {
        uploadHRRequirementsWith(file);
      } else {
        uploadResumesWith(file);
      }
      if (e.target) e.target.value = '';
    },
    [uploadHRRequirementsWith, uploadResumesWith]
  );

  const pollStatus = useCallback(async () => {
    try {
      if (jobRequirementId && processingJDStatus === 'processing_jd') {
        const { data } = await api.getJobRequirementStatus(jobRequirementId);
        if (data.status === 'success' || data.status === 'processed_jd') {
          setProcessingJDStatus('job_description_ready');
          setJobTitle(data.title || 'Job Title Extracted');
        } else if (data.status === 'failed_jd') {
          setProcessingJDStatus('error');
          setErrorMessage('Failed to process Job Description.');
        }
      }

      if (resumeBatchId && processingResumeStatus === 'processing_resumes') {
        const { data } = await api.getResumeBatchStatus(resumeBatchId);
        if (data.status === 'completed') {
          setProcessingResumeStatus('completed');
          fetchRankedResumes(resumeBatchId);
        } else if (data.status === 'failed') {
          setProcessingResumeStatus('error');
          setErrorMessage('Failed to rank resumes.');
        }
      }
    } catch (err) {
      setProcessingResumeStatus('error');
      setProcessingJDStatus('error');
      setErrorMessage('Polling error: ' + err.message);
    }
  }, [jobRequirementId, resumeBatchId, processingJDStatus, processingResumeStatus]);

  useEffect(() => {
    if (
      (processingJDStatus === 'processing_jd' ||
        processingResumeStatus === 'processing_resumes') &&
      !pollingIntervalRef.current
    ) {
      pollingIntervalRef.current = setInterval(pollStatus, 3000);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [processingJDStatus, processingResumeStatus, pollStatus]);

  const fetchRankedResumes = async (batchId, page = 1) => {
  try {
    const response = await api.getRankedResumes(batchId, page);
    const data = response.data;
    // Handle both shapes: paginated object or legacy array
    const items = Array.isArray(data) ? data : (data.results || []);
    setRankedResumes(items);
    setSuccessMessage('Resumes loaded!');
  } catch (error) {
    setErrorMessage(error.response?.data?.detail || error.message);
  }
};


  const resetDashboard = () => {
    setJobRequirementId(null);
    setResumeBatchId(null);
    setProcessingJDStatus('idle');
    setProcessingResumeStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
    setRankedResumes([]);
    setJobTitle('');
    setUploadedFileNames({ hr: '', zip: '' });
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const renderStatusMessage = () => {
    if (errorMessage)
      return (
        <div className="glass" style={{borderColor:'rgba(239,68,68,.4)'}}>
          <p className="status-message error-message">{errorMessage}</p>
        </div>
      );
    if (successMessage)
      return (
        <div className="glass" style={{borderColor:'rgba(16,185,129,.35)'}}>
          <p className="status-message success-message">{successMessage}</p>
        </div>
      );
    return null;
  };

  // tiny helpers for visual chips
  const StatusChip = ({ state, readyText }) => {
    if (state === 'idle') return null;
    if (state === 'error') return (
      <div className="badge" style={{background:'rgba(239,68,68,.15)', borderColor:'rgba(239,68,68,.35)'}}>Failed</div>
    );
    if (state === 'job_description_ready' || state === 'completed')
      return (
        <div className="badge" style={{background:'rgba(16,185,129,.18)', borderColor:'rgba(16,185,129,.35)'}}>
          <CheckCircle2 size={16} /> {readyText}
        </div>
      );
    return (
      <div className="badge" style={{background:'rgba(255,255,255,.10)'}}>
        <Loader2 size={16} className="spin" /> Processing…
      </div>
    );
  };

  const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const stagger = { show: { transition: { staggerChildren: 0.10 } } };

  return (
    <div className="about" style={{minHeight:'100vh'}}>
      {/* soft orbs from About.css for continuity */}
      <div className="orb one" />
      <div className="orb two" />

      {/* Hero / Heading */}
      <section className="container pt-hero">
        <div className="grid-hero">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="sp-vertical">
            <p className="badge"><Sparkles size={16} /> Your hiring co-pilot</p>
            <h1 className="title">Resumely <span>Dashboard</span></h1>
            <p className="lead">Upload the HR PDF, then the ZIP of résumés. We’ll parse, score, and rank for you </p>
            <div className="actions">
              <button onClick={resetDashboard} className="btn btn-ghost" title="Start Over">
                <RefreshCcw size={16} /> Reset
              </button>
              {processingJDStatus === 'job_description_ready' && (
                <div className="badge">Role: {jobTitle}</div>
              )}
            </div>
            {renderStatusMessage()}
          </motion.div>

          {/* Process Snapshot */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <div className="hero-figure">
              <div className="hero-card" style={{display:'grid', placeItems:'center'}}>
                <div className="cards" style={{padding:16}}>
                  <div className="glass" style={{display:'flex', alignItems:'center', gap:12}}>
                    <Upload size={18} />
                    <div>
                      <div className="card-title">HR PDF</div>
                      <StatusChip state={processingJDStatus} readyText="Requirements Noted" />
                      {uploadedFileNames.hr && (
                        <p className="muted" style={{marginTop:6}}>File: {uploadedFileNames.hr}</p>
                      )}
                    </div>
                  </div>
                  <div className="glass" style={{display:'flex', alignItems:'center', gap:12}}>
                    <Files size={18} />
                    <div>
                      <div className="card-title">Résumés ZIP</div>
                      <StatusChip state={processingResumeStatus} readyText="Ranking Complete" />
                      {uploadedFileNames.zip && (
                        <p className="muted" style={{marginTop:6}}>File: {uploadedFileNames.zip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upload Area — glass cards matching About page */}
      <section className="container section">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="cards">
          {/* HR REQUIREMENTS */}
          <motion.div variants={fadeUp} className="glass">
            <div className="chip" style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <Upload size={18} /> HR REQUIREMENTS
            </div>
            <p className="muted">Upload a single PDF describing the role.</p>

            <div className="upload-box" style={{marginTop:12}}>
              <button
                className="btn btn-primary upload-btn"
                onClick={() => hrFileInputRef.current?.click()}
                disabled={processingJDStatus !== 'idle'}
              >
                Choose PDF
              </button>
              <input
                type="file"
                ref={hrFileInputRef}
                accept=".pdf"
                hidden
                onChange={(e) => handleFileChange('hr', e)}
                disabled={processingJDStatus !== 'idle'}
              />
              {uploadedFileNames.hr && (
                <div className="file-status-container" style={{marginTop:10}}>
                  <p className="file-name">
                    {uploadedFileNames.hr}
                    {processingJDStatus === 'uploading_jd' || processingJDStatus === 'processing_jd' ? (
                      <span className="file-processing"> Processing…</span>
                    ) : processingJDStatus === 'job_description_ready' ? (
                      <span className="file-tick">✓</span>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* RESUMES ZIP */}
          <motion.div variants={fadeUp} className="glass">
            <div className="chip" style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <Files size={18} /> RESUMES
            </div>
            <p className="muted">Upload a .zip containing candidate résumé PDFs.</p>

            <div className="upload-box" style={{marginTop:12}}>
              <button
                className="btn btn-primary upload-btn"
                onClick={() => zipFileInputRef.current?.click()}
                disabled={processingJDStatus !== 'job_description_ready'}
              >
                Choose ZIP
              </button>
              <input
                type="file"
                ref={zipFileInputRef}
                accept=".zip"
                hidden
                onChange={(e) => handleFileChange('zip', e)}
                disabled={processingJDStatus !== 'job_description_ready'}
              />
              {uploadedFileNames.zip && (
                <div className="file-status-container" style={{marginTop:10}}>
                  <p className="file-name">
                    {uploadedFileNames.zip}
                    {processingResumeStatus === 'uploading_resumes' || processingResumeStatus === 'processing_resumes' ? (
                      <span className="file-processing"> Processing…</span>
                    ) : processingResumeStatus === 'completed' ? (
                      <span className="file-tick">✓</span>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Helper steps (visual only) */}
        <div className="how" style={{paddingTop:24}}>
          <div className="how-grid">
            {[
              { icon: <Upload size={16} />, title: 'Upload HR PDF', desc: 'Add your role description.' },
              { icon: <Files size={16} />, title: 'Upload Résumés ZIP', desc: 'Add all candidate PDFs.' },
              { icon: <FileText size={16} />, title: 'AI Scoring', desc: 'We parse and score each résumé.' },
              { icon: <LineChart size={16} />, title: 'Ranked Results', desc: 'Review the top matches.' },
            ].map((s, i) => (
              <div key={i} className="glass" style={{position:'relative'}}>
                <div className="chip" style={{display:'inline-flex', alignItems:'center', gap:8}}>{s.icon}</div>
                <h4 className="card-title" style={{fontSize:18}}>{s.title}</h4>
                <p className="muted">{s.desc}</p>
                {i < 3 && <div className="arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      {rankedResumes.length > 0 && processingResumeStatus === 'completed' && (
        <section className="container section" style={{paddingBottom:56}}>
          <div className="glass">
            <div className="row" style={{justifyContent:'space-between'}}>
              <h2 className="card-title" style={{fontSize:22}}>Top Ranked Resumes {jobTitle ? `(Job: ${jobTitle})` : ''}</h2>
              <div className="badge"><CheckCircle2 size={16}/> Completed</div>
            </div>
            <div className="cards" style={{marginTop:16}}>
              {rankedResumes.map((r) => (
                <div key={r.id} className="glass" style={{borderRadius:18}}>
                  <div className="row" style={{justifyContent:'space-between'}}>
                    <h3 className="card-title" style={{fontSize:20}}>{r.candidate_name || 'N/A'}</h3>
                    <div className="badge"><ScoreCircle value={r.compatibility_score} size={64} stroke={6}></ScoreCircle></div>
                  </div>
                  {r.file_name && <p className="muted" style={{marginTop:6}}>File: {r.file_name}</p>}

                  {r.ranking_analysis?.Strengths && (
                    <div style={{marginTop:10}}>
                      <h4 className="card-title" style={{fontSize:16}}>Key Strengths</h4>
                      <ul className="muted" style={{margin:'6px 0 0 18px'}}>
                        {r.ranking_analysis.Strengths.map((s, i) => (
                          <li key={i} style={{marginBottom:4}}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(r.extracted_info?.JobTitles) && r.extracted_info.JobTitles.length > 0 && (
                    <p className="muted"><strong>Job Titles:</strong> {r.extracted_info.JobTitles.join(', ')}</p>
                  )}
                  {Array.isArray(r.extracted_info?.Companies) && r.extracted_info.Companies.length > 0 && (
                    <p className="muted"><strong>Companies:</strong> {r.extracted_info.Companies.join(', ')}</p>
                  )}
                  {r.extracted_info?.YearsOfExperience && (
                    <p className="muted"><strong>Experience:</strong> {r.extracted_info.YearsOfExperience}</p>
                  )}
                  {Array.isArray(r.extracted_info?.Skills) && r.extracted_info.Skills.length > 0 && (
                    <p className="muted"><strong>Skills:</strong> {r.extracted_info.Skills.join(', ')}</p>
                  )}
                  {Array.isArray(r.extracted_info?.Degree) && r.extracted_info.Degree.length > 0 && (
                    <p className="muted"><strong>Degrees:</strong> {r.extracted_info.Degree.join(', ')}</p>
                  )}
                  {Array.isArray(r.extracted_info?.GraduationYears) && r.extracted_info.GraduationYears.length > 0 && (
                    <p className="muted"><strong>Graduation Year:</strong> {r.extracted_info.GraduationYears.join(', ')}</p>
                  )}
                  {Array.isArray(r.extracted_info?.EducationalInstitutions) && r.extracted_info.EducationalInstitutions.length > 0 && (
                    <p className="muted"><strong>Educational Institutions:</strong> {r.extracted_info.EducationalInstitutions.join(', ')}</p>
                  )}

                  {r.candidate_email && <p className="muted"><strong>Email:</strong> {r.candidate_email}</p>}
                  {r.extracted_info?.Phone && <p className="muted"><strong>Phone:</strong> {r.extracted_info.Phone}</p>}
                  {r.extracted_info?.Location && <p className="muted"><strong>Location:</strong> {r.extracted_info.Location}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA footer to encourage next action */}
      <section className="cta">
        <div className="container">
          <div className="cta-box">
            <div>
              <h3 style={{fontSize:24, fontWeight:800}}>Need to run a new role?</h3>
              <p className="muted" style={{marginTop:8}}>Upload another HR PDF and compare ranked lists.</p>
            </div>
            <button onClick={resetDashboard} className="btn btn-primary">
              Start Over
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
