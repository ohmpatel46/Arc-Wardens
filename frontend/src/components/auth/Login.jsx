import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useState, useEffect } from 'react';

export default function Login() {
    const { login } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Login Success:', tokenResponse);
            try {
                const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
                const backendResponse = await axios.post(`${apiBase}/auth/google`, {
                    token: `access_token_${tokenResponse.access_token}`
                });

                if (backendResponse.data.user) {
                    const user = {
                        ...backendResponse.data.user,
                        sub: backendResponse.data.user.user_id || backendResponse.data.user.sub
                    };

                    login(
                        { credential: `access_token_${tokenResponse.access_token}` },
                        tokenResponse.access_token,
                        user
                    );
                }
            } catch (err) {
                console.error('Error fetching user info:', err);
            }
        },
        onError: (error) => console.log('Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    });

    return (
        <div className="min-h-screen bg-gray-900 text-white font-[Inter] w-full overflow-x-hidden selection:bg-indigo-500/30">
            {/* Background Ambient Effects - Fixed position to prevent scroll issues */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
                <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px]" />
            </div>

            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/80 backdrop-blur-xl border-b border-white/[0.05]' : 'bg-transparent border-transparent'} top-0 left-0`}>
                <div className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Arc Wardens</span>
                    </div>
                    <button
                        onClick={() => googleLogin()}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-48 pb-32 px-6 w-full">
                <div className="container mx-auto max-w-5xl text-center">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-indigo-200/80 text-xs font-semibold uppercase tracking-wider mb-10 animate-fade-in-up backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Accepting Early Access
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
                        Intelligent Outreach <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Reimagined.</span>
                    </h1>

                    <p className="text-lg text-gray-400 mb-14 max-w-2xl mx-auto leading-relaxed font-light">
                        Scale your sales campaigns with verifying data sourcing and AI-driven personalization.
                        The dual-engine system that ensures your value prop lands in the primary inbox.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                        <button
                            onClick={() => googleLogin()}
                            className="w-full sm:w-auto px-8 py-4 bg-[#FFFFFF] hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {/* Corrected Google Logo with Official Colors */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                        <button
                            className="w-full sm:w-auto px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white rounded-xl font-semibold text-lg transition-all border border-white/10 backdrop-blur-sm hover:border-white/20 active:scale-[0.98]"
                            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Explore Features
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-32 px-6 w-full">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Everything you need to <span className="text-indigo-400">scale</span></h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg">
                            From data sourcing to email delivery, our platform handles the heavy lifting so you can focus on closing deals.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 text-indigo-400 group-hover:scale-110 transition-transform duration-500 border border-indigo-500/20">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-100">Premium Data Sourcing</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Access verified B2B data. We source and validate contacts in real-time to ensure your campaigns reach real decision makers.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 text-purple-400 group-hover:scale-110 transition-transform duration-500 border border-purple-500/20">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-100">Hyper-Personalization</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Our AI engine analyzes prospect data to craft unique, relevant messages that drive engagement and response rates.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-orange-500/30 transition-all duration-500 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-8 text-orange-400 group-hover:scale-110 transition-transform duration-500 border border-orange-500/20">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-100">Live Analytics</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Monitor your campaign health with real-time tracking of opens, clicks, and replies. Optimize on the fly.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="relative z-10 py-24 px-6">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-b from-indigo-900/20 to-gray-900 border border-white/[0.08] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>

                        {/* Glowing radial gradient behind text */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 blur-[100px] rounded-full group-hover:bg-indigo-500/30 transition-colors duration-700"></div>

                        <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10 tracking-tight text-white">Ready to automate?</h2>
                        <p className="text-gray-300 mb-10 max-w-lg mx-auto relative z-10 text-lg">
                            Join thousands of forward-thinking sales teams using Arc Wardens to drive revenue.
                        </p>
                        <button
                            onClick={() => googleLogin()}
                            className="px-12 py-5 bg-white text-indigo-950 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-2xl hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] hover:-translate-y-1 relative z-10"
                        >
                            Get Started Now
                        </button>
                    </div>

                    <footer className="mt-20 border-t border-white/5 pt-10 text-center text-gray-600 text-sm">
                        <div className="flex justify-center gap-8 mb-6">
                            <span className="cursor-pointer hover:text-gray-400 transition-colors">Privacy Policy</span>
                            <span className="cursor-pointer hover:text-gray-400 transition-colors">Terms of Service</span>
                            <span className="cursor-pointer hover:text-gray-400 transition-colors">Contact</span>
                        </div>
                        <p>&copy; {new Date().getFullYear()} Arc Wardens. All rights reserved.</p>
                    </footer>
                </div>
            </section>
        </div>
    );
}
