import React from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram, 
  ArrowUp,
  Heart
} from 'lucide-react';
import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-l from-blue-600/20 to-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Company Info */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              JobSmartly
              </h3>
              <p className="text-slate-300 mb-6 max-w-md">
                Empowering professionals to transform their careers and land their dream jobs.
              </p>
              
              {/* Contact Info */}
              <div className="flex flex-col sm:flex-row gap-4 text-sm">
                {/* <div className="flex items-center space-x-2 text-slate-300">
                  <Phone className="w-4 h-4 text-purple-400" />
                  <span>+1 (555) 123-4567</span>
                </div> */}
                <div className="flex items-center space-x-2 text-slate-300">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>hello@jobsmartly.com</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            {/* <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Services</h4>
              <ul className="space-y-2 text-sm">
                {["Career Coaching", "Resume Writing", "Interview Prep", "Skill Development"].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-slate-300 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div> */}

            {/* Company Links */}
            {/* <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                {["Contact"].map((item, index) => (
                  <li key={index}>
                    {item === "Contact" ? (
                      <Link to="/contact" className="text-slate-300 hover:text-white transition-colors">
                        {item}
                      </Link>
                    ) : (
                      <a href="#" className="text-slate-300 hover:text-white transition-colors">
                        {item}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div> */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Copyright */}
              <div className="text-slate-400 text-sm text-center md:text-left">
                <p>&copy; 2025 JobSmartly. Made with <Heart className="w-4 h-4 text-red-400 inline mx-1" /> for career success</p>
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-3">
                {[
                  { icon: Linkedin, color: "hover:text-blue-400" },
                  { icon: Twitter, color: "hover:text-sky-400" },
                  { icon: Facebook, color: "hover:text-blue-500" },
                  { icon: Instagram, color: "hover:text-pink-400" }
                ].map((social, index) => (
                  <a
                    key={index}
                    href="#"
                    className={`w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 ${social.color} hover:bg-slate-700 transition-all hover:scale-110`}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}

                {/* Scroll to Top */}
                <button
                  onClick={scrollToTop}
                  className="w-9 h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full flex items-center justify-center ml-2 transition-all hover:scale-110"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 