import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Gauge, Users, ShieldCheck } from 'lucide-react';
import '../styles/About.css';
import '../styles/WhyUs.css';

const WhyUs = () => {
  const navigate = useNavigate();
  const handleGoToDashboard = () => { navigate('/dashboard'); };

  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.12 });
    if (ref.current) observer.observe(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div id="why" ref={ref} className={`why-us-section fade-in-section ${isVisible ? 'visible' : ''}`}>
      <div className="why-us-container">
        <h1 className="why-us-title">Why Choose Resumely?</h1>
        <p className="why-us-description">
          At Resumely, we streamline your hiring. Our AI rapidly analyzes résumés against your HR requirements
          and surfaces the best-fit candidates—so you spend time interviewing, not sifting.
        </p>

        <div className="why-us-grid">
          <div className="feature-card">
            <div className="chip"><Gauge size={16}/> <span>Speed</span></div>
            <p className="muted">Batch-screen dozens of résumés in minutes with live status updates.</p>
          </div>

          <div className="feature-card">
            <div className="chip"><Users size={16}/> <span>Accuracy</span></div>
            <p className="muted">Extracted experience, skills, education and more are surfaced clearly.</p>
          </div>

          <div className="feature-card">
            <div className="chip"><ShieldCheck size={16}/> <span>Fairness</span></div>
            <p className="muted">Consistent, criteria-driven ranking helps reduce bias in early screening.</p>
          </div>
        </div>

        <div className="why-us-cta">
          <button className="why-us-button btn btn-primary" onClick={handleGoToDashboard}>
            Go to Dashboard <span className="arrow">→</span>
          </button>
        </div>

        
      </div>
    </div>
  );
};

export default WhyUs;