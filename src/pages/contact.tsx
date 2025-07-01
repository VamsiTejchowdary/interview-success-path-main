import React, { useState } from 'react';
import { 
  MessageSquare, 
  Loader2, 
  Phone, 
  Mail, 
  MapPin, 
  Send, 
  CheckCircle,
  Clock,
  Users,
  Star,
  ArrowRight,
  Building2,
  Shield,
  Award,
  Globe
} from 'lucide-react';
import Footer from '@/components/ui/Footer';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error('Contact form error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Gradient */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-20 lg:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/5"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8">
              <MessageSquare className="w-5 h-5 text-blue-300 mr-2" />
              <span className="text-white font-medium">Professional Contact</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Let's Start a 
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent"> Conversation</span>
            </h1>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Ready to transform your career? Connect with our expert team and discover personalized solutions for your professional growth.
            </p>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-yellow-400 fill-current" />
                </div>
                <div className="text-2xl font-bold text-white">4.9★</div>
                <div className="text-sm text-white/70">Client Rating</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm text-white/70">Success Stories</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">24h</div>
                <div className="text-sm text-white/70">Response Time</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">Global</div>
                <div className="text-sm text-white/70">Reach</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-16">
              
              {/* Contact Information Sidebar */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">Get in Touch</h2>
                  <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                    Our team of career experts is here to help you achieve your professional goals. Reach out today and let's build your success story together.
                  </p>

                  {/* Contact Methods */}
                  <div className="space-y-6 mb-12">
                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Phone</h3>
                        <p className="text-slate-600">+1 (555) 123-4567</p>
                        <p className="text-sm text-slate-500">Mon-Fri 9AM-6PM EST</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Email</h3>
                        <p className="text-slate-600">hello@candidateside.com</p>
                        <p className="text-sm text-slate-500">We'll respond within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Location</h3>
                        <p className="text-slate-600">Remote Services</p>
                        <p className="text-sm text-slate-500">Serving clients globally</p>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-slate-600">SSL Secured & Confidential</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Award className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-slate-600">Certified Career Professionals</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-slate-600">Trusted by Fortune 500</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-3">
                {/* Success Message */}
                {isSubmitted && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">Message sent successfully!</h3>
                        <p className="text-green-700 mt-1">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Form Header */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Send us a message</h3>
                    <p className="text-slate-600">Fill out the form below and we'll get back to you as soon as possible.</p>
                  </div>

                  {/* Name and Email Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 placeholder-slate-400"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 placeholder-slate-400"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Company and Phone Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 placeholder-slate-400"
                        placeholder="Your Company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 placeholder-slate-400"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="career-coaching">Career Coaching</option>
                      <option value="resume-review">Resume Review</option>
                      <option value="general-inquiry">General Inquiry</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 placeholder-slate-400 resize-none"
                      placeholder="Tell us about your career goals and how we can help you achieve them..."
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          Send Message
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Privacy Note */}
                  <p className="text-sm text-slate-500 pt-4">
                    By submitting this form, you agree to our privacy policy. We respect your privacy and will never share your information with third parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;