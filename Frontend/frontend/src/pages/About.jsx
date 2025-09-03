import '../styles/About.css'
import { motion } from "framer-motion";
import {
  Rocket,
  Shield,
  GaugeCircle,
  Sparkles,
  Upload,
  Files,
  FileText,
  LineChart,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function About() {
  
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };
  const stagger = { show: { transition: { staggerChildren: 0.5 } } };

 

  return (
    <div className="about">
      
      <div className="orb one" />
      <div className="orb two" />

      {/* Hero */}
      <section className="container pt-hero">
        <div className="grid-hero">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="sp-vertical">
            <p className="badge">
              <Sparkles size={16} />
              AI résumé screening, simplified
            </p>
            <h1 className="title">About <span>Resumely</span></h1>
            <p className="lead">
              Resumely helps teams quickly find the right candidates by matching
              your HR requirements with a pile of résumés — accurately, fairly,
              and beautifully. No more spreadsheet chaos or manual triage.
            </p>
            <div className="actions">
              <a href="#how" className="btn btn-ghost">
                See how it works
                <ArrowRight size={16} />
              </a>
              
            </div>
          </motion.div>

          {/* Hero Illustration */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            <div className="hero-figure">
              <div className="hero-card">
                <img className="hero-img" src="/src/assets/ChatGPT-Image-Apr-10-2025-03_16_02-PM.png" alt="Team reviewing resumes" />
              </div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="float left">
                <div className="row" style={{gap:8, alignItems:'center'}}>
                  <CheckCircle2 size={18} />
                  <h6>Top Matches Ready</h6>
                </div>
                <p>Ranked list generated in seconds.</p>
              </motion.div>
              <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 5, repeat: Infinity }} className="float right small">
                <div className="row" style={{gap:8, alignItems:'center'}}>
                  <GaugeCircle size={18} />
                  <h6>6× Faster</h6>
                </div>
                <p>than manual review</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Props */}
      <section className="container section">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="cards">
          {[{
            icon: <LineChart size={20} />, title: "Accurate Matching", desc: "We map skills, experience, and role requirements to compute a compatibility score.",
          }, {
            icon: <Shield size={20} />, title: "Private & Secure", desc: "Your files stay protected. We only process what’s needed for ranking.",
          }, {
            icon: <Rocket size={20} />, title: "Lightning Fast", desc: "Process hundreds of résumés in a fraction of the time.",
          }].map((c, i) => (
            <motion.div key={i} variants={fadeUp} className="glass">
              <div className="chip">{c.icon}</div>
              <h3 className="card-title">{c.title}</h3>
              <p className="muted">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how" className="container how">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          How Resumely Works
        </motion.h2>
        <div className="how-grid">
          {[
            { icon: <Upload size={20} />, title: "Upload HR PDF", desc: "Drop your job requirements (PDF)." },
            { icon: <Files size={20} />, title: "Upload Résumés ZIP", desc: "Add a folder of candidate PDFs." },
            { icon: <FileText size={20} />, title: "AI Scoring", desc: "We parse, normalize and score each résumé." },
            { icon: <LineChart size={20} />, title: "Ranked Results", desc: "See the best-fit list with details & contact." },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="glass" style={{ position:'relative' }}>
              <div className="chip">{s.icon}</div>
              <h4 className="card-title" style={{fontSize:18}}>{s.title}</h4>
              <p className="muted">{s.desc}</p>
              {i < 3 && <div className="arrow">→</div>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="container section" style={{paddingBottom:48}}>
        <div className="glass">
          <div className="stats">
            {[{ n: "10,000+", k: "Résumés processed" }, { n: "6×", k: "Faster screening" }, { n: "92%", k: "Avg. satisfaction" }].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="center">
                <div className="stat-n">{stat.n}</div>
                <div className="stat-k">{stat.k}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

     
     

      {/* FAQ */}
      <section className="faq">
        <div className="container">
          <h3>FAQs</h3>
          <div className="sp-vertical">
            {[
              { q: "Is my data secure?", a: "Yes. Files are processed securely and never shared. You control uploads and can delete them anytime." },
              { q: "Which formats are supported?", a: "PDFs work best for both HR requirements and résumés. More formats are coming soon." },
              { q: "Can I use it for multiple roles?", a: "Absolutely—upload a different HR PDF for each role and compare results." },
            ].map((f, i) => (
              <details key={i} className="details">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <div className="cta-box">
            <div>
              <h3 style={{fontSize:24, fontWeight:800}}>Ready to save hours this week?</h3>
              <p className="muted" style={{marginTop:8}}>Upload your HR PDF and résumés to get an instant ranked list.</p>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
