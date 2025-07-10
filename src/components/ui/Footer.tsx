import { Linkedin, ArrowUp, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-16 pb-8 relative overflow-hidden">
      {/* Top CTA */}
      <section className="section_footer pb-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                <span className="text-blue-400 italic">Get started</span>
                <span className="block">today</span>
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <p className="text-white text-lg hidden md:block">
            Spend less time applying, more time interviewing.
            </p>
            <a
              href="https://jobsmartly.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="button bg-white text-slate-900 font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-100 transition"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Middle Links */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-700">
        {/* Follow Us */}
        <div>
          <div className="font-semibold mb-2">Follow us</div>
          <div className="flex gap-3">
            <a href="https://www.linkedin.com/company/send-blue" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer_social-icon w-10 h-10 flex items-center justify-center bg-white rounded-full hover:scale-110 transition">
              <Linkedin className="text-slate-900 w-5 h-5" />
            </a>
            {/* Add more social icons as needed */}
          </div>
        </div>
        {/* Company */}
       
      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
        <button
          onClick={scrollToTop}
          className="flex items-center gap-2 text-white hover:underline"
        >
          <span>Back to the top</span>
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
      <div className="text-center text-slate-400 text-sm mt-6">
        &copy; 2025 JobSmartly. Made with <Heart className="w-4 h-4 text-red-400 inline mx-1" /> for career success
      </div>
    </footer>
  );
};

export default Footer; 