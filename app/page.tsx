'use client';

import Link from "next/link";
import { 
  Shield, 
  Lock, 
  Users, 
  FileCheck, 
  Cloud, 
  Key,
  ArrowRight,
  CheckCircle,
  Database,
  Activity
} from "lucide-react";
import dynamic from 'next/dynamic'
const Spline = dynamic(
  () => import("@splinetool/react-spline"),
  { ssr: false }
);
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Spline Background */}
      <div className="fixed inset-0 z-0">
        <Spline scene="https://prod.spline.design/75Xxwu3hq9vRuQ-T/scene.splinecode" />
      </div>

      {/* Overlay for better text readability */}
      <div className="fixed inset-0 z-[1] bg-slate-900/60 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Vaultix
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#security" className="text-slate-300 hover:text-white transition-colors">Security</a>
              <a href="#compliance" className="text-slate-300 hover:text-white transition-colors">Compliance</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in" className="text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link 
                href="/sign-up" 
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <Lock className="w-4 h-4 mr-2" />
            Enterprise-Grade Security
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Secure Cloud Storage
            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              You Can Trust
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            Protect your critical documents with military-grade encryption, role-based access control, 
            and comprehensive audit logging. Built for organizations that demand the highest security standards.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/sign-up"
              className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-xl shadow-emerald-500/30 flex items-center"
            >
              Start Securing Your Files
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features"
              className="px-8 py-4 border border-slate-500 text-slate-200 font-semibold rounded-xl hover:bg-slate-800/80 hover:border-slate-400 transition-all backdrop-blur-sm"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="relative z-10 py-12 border-y border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-1">256-bit</div>
              <div className="text-slate-400 text-sm">AES Encryption</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">99.99%</div>
              <div className="text-slate-400 text-sm">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">SOC 2</div>
              <div className="text-slate-400 text-sm">Compliant</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">HIPAA</div>
              <div className="text-slate-400 text-sm">Ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Enterprise Security Features
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Everything you need to securely store, manage, and share critical documents
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-slate-800/70 backdrop-blur-md border border-slate-700/50 rounded-2xl hover:border-emerald-500/30 transition-all group">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Lock className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">End-to-End Encryption</h3>
              <p className="text-slate-400 leading-relaxed">
                Your files are encrypted at rest and in transit using AES-256 encryption. 
                Only authorized users can decrypt and access your documents.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-slate-800/70 backdrop-blur-md border border-slate-700/50 rounded-2xl hover:border-cyan-500/30 transition-all group">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                <Users className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Role-Based Access Control</h3>
              <p className="text-slate-400 leading-relaxed">
                Define granular permissions for users and groups. Control who can view, 
                edit, download, or share each document.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-slate-800/70 backdrop-blur-md border border-slate-700/50 rounded-2xl hover:border-blue-500/30 transition-all group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Key className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Identity Management</h3>
              <p className="text-slate-400 leading-relaxed">
                Secure authentication with MFA, SSO integration, and advanced identity 
                verification to prevent unauthorized access.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-slate-800/70 backdrop-blur-md border border-slate-700/50 rounded-2xl hover:border-purple-500/30 transition-all group">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Activity className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Audit Logging</h3>
              <p className="text-slate-400 leading-relaxed">
                Comprehensive audit trails track every action. Know who accessed what, 
                when, and from where for complete accountability.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 bg-slate-800/70 backdrop-blur-md border border-slate-700/50 rounded-2xl hover:border-orange-500/30 transition-all group">
              <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors">
                <Database className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Disaster Recovery</h3>
              <p className="text-slate-400 leading-relaxed">
                Automatic backups across multiple regions ensure your data survives any 
                disaster. Restore files instantly when needed.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 bg-slate-800/70 backdrop-blur-md border border-slate-700/50 rounded-2xl hover:border-pink-500/30 transition-all group">
              <div className="w-14 h-14 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-500/20 transition-colors">
                <Cloud className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Scalable Storage</h3>
              <p className="text-slate-400 leading-relaxed">
                Handle multiple users concurrently and scale seamlessly with increasing 
                data volume. No limits on growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="relative z-10 py-24 px-6 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">
                Built for Security-First Organizations
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Whether youre storing certificates, contracts, medical records, or academic files, 
                Vaultix provides the security infrastructure you need to protect sensitive data 
                from breaches and unauthorized access.
              </p>
              
              <div className="space-y-4">
                {[
                  "Zero-knowledge encryption architecture",
                  "Real-time threat detection and monitoring",
                  "Automatic data classification and protection",
                  "Secure file sharing with expiring links",
                  "Complete data sovereignty controls"
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="text-slate-500"> Security Status</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-300">Encryption: <span className="text-emerald-400">AES-256</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-300">MFA: <span className="text-emerald-400">Enabled</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-300">Audit Log: <span className="text-emerald-400">Active</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-300">Backup: <span className="text-emerald-400">Multi-Region</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-300">Threats Blocked: <span className="text-cyan-400">1,247</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section id="compliance" className="relative z-10 py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">
            Compliance Made Simple
          </h2>
          <p className="text-slate-300 text-lg mb-12 max-w-2xl mx-auto">
            Meet regulatory requirements with built-in compliance features for healthcare, 
            finance, education, and government sectors.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["HIPAA", "GDPR", "SOC 2", "ISO 27001"].map((cert) => (
              <div key={cert} className="p-6 bg-slate-800/70 backdrop-blur-md border border-slate-700/50 rounded-xl">
                <FileCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <div className="text-white font-semibold">{cert}</div>
                <div className="text-slate-400 text-sm">Compliant</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-cyan-600 p-12 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC00djJoNHYtMnptMC02aC00djJoNHYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Secure Your Documents?
              </h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of organizations that trust Vaultix to protect their most sensitive files.
              </p>
              <Link 
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Vaultix
              </span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 Vaultix. Secure cloud storage for critical documents.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
