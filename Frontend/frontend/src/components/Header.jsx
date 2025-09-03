import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/About.css";
import "../styles/Header.css";
import bgwoman from "../assets/bg-woman.jpg";

const Header = () => {
  const navigate = useNavigate();
  const handleGetStartedClick = () => {
    navigate("/login");
  };

  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

  return (
    <header className="header">
      {/* background visual */}
      <img src={bgwoman} alt="Background woman" className="header-bg" />

      {/* content side */}
      <div className="header-content">
        <motion.p variants={fadeUp} initial="hidden" animate="show" className="badge">AI-powered screening</motion.p>
        <motion.h1 variants={fadeUp} initial="hidden" animate="show" className="title">Don't waste your time</motion.h1>
        <motion.h3 variants={fadeUp} initial="hidden" animate="show" className="subtitle" style={{marginTop:4}}>Let us make your work easier!</motion.h3>
        <motion.p variants={fadeUp} initial="hidden" animate="show" className="header-description lead" style={{maxWidth:560}}>
          Let us go through all the Resumes and figure out the top candidates for you.
        </motion.p>
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="header-button-container actions">
          <button onClick={handleGetStartedClick} className="btn btn-primary">Get Started</button>
          <a href="#why" className="btn btn-ghost">Why Resumely?</a>
        </motion.div>
      </div>
    </header>
  );
}

export default Header;