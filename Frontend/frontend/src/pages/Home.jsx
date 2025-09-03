import Header from "../components/Header";
import WhyUs from "../components/WhyUs";
import "../styles/About.css"; // reuse gradients, glass, orbs
import "../styles/Header.css"; // keep your existing header tweaks
import "../styles/WhyUs.css";  // keep your existing why-us tweaks
import "../styles/Home.css";

const Home = () => {
  return (
    <div className="about" style={{minHeight:'100vh', overflow:'hidden'}}>
      {/* soft background orbs from About.css for brand consistency */}
      <div className="orb one" />
      <div className="orb two" />

      {/* Hero */}
      <Header />

      {/* Content sections */}
      <section className="container section" style={{paddingTop: 0}}>
        <WhyUs />
      </section>

      {/* CTA footer matching About style */}
      <section className="cta">
        <div className="container">
          <div className="cta-box">
            <div>
              <h3 style={{fontSize:24, fontWeight:800}}>Ready to shortlist candidates faster?</h3>
              <p className="muted" style={{marginTop:8}}>Jump into the dashboard and start a new role with your HR PDF.</p>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
