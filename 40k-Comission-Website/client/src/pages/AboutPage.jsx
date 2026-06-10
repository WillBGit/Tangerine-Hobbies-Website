import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="page">
      <div className="container about-container">
        <div className="about-hero">
          <div className="about-avatar-wrap">
            <Logo size={160} />
          </div>
          <div className="about-intro">
            <h1 className="page-title">About Me</h1>
            <p className="about-tagline">Painter. Hobbyist. Servant of the Dark Prince.</p>
          </div>
        </div>

        <div className="about-body">
          <section className="about-section">
            <h2>Who I Am</h2>
            <p>
              Hello! My name is Will and I'm the mind behind Tangerine Hobbies. I've been a Warhammer hobbiest for over 6 years. While Adeptus Mechanicus was my first love in this hobby, I have sinced branched out into a variety of armies and every Warhammer system under the sun. If you're looking for someone to bring your next hobby project to life, whether to simply get more models on the table or to give your favorite warlord or unit some special flare, then this is the place to be!
            </p>
          </section>

          <section className="about-section">
            <h2>My Style</h2>
            <p>
              My style leans heavily into smooth, clean gradients and vibrant eye catching colors to create miniatures that stand out on the tabletop. For models with a more grimdark flare, I then make heavy use of sponging, drybrushing, and enamel paints to create a muddy, battle worn look while using selective OSL and contrasting colors to draw the eye to the import sections of your model.
            </p>
          </section>

          <section className="about-section">
            <h2>Specialties</h2>
            <ul className="about-list">
              <li>Vibrant, eye catching paintjobs</li>             
              <li>Battleworn paintjobs</li>
              <li>Heretic Astartes factions</li>
              <li>Airbrush gradients</li>
              <li>OSL (Object Source Lighting)</li>
              <li>Freehand warband markings</li>
              <li>Thematic Basing</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>How It Works</h2>
            <ol className="about-steps">
              <li><span>01</span> Submit a commission request with your models and vision.</li>
              <li><span>02</span> I'll review and get back to you within 48 hours to discuss details and confirm pricing.</li>
              <li><span>03</span> Once we settle on a price, 50% will be due up front. I'll send progress photos as I go.</li>
              <li><span>04</span> Final payment on completion, then your models ship back to you.</li>
            </ol>
          </section>
        </div>

        <div className="about-cta">
          <h3>Ready to get started?</h3>
          <p>Fill out a request and let's make your dream a reality!.</p>
          <Link to="/request" className="btn-primary">Request a Commission</Link>
        </div>
      </div>
    </div>
  );
}
