import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function Login() {
    const { login } = useAuth();
    const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID &&
        import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Login Success:', tokenResponse);
            try {
                // Determine API_BASE based on environment or default to local proxy
                const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';

                // Fetch user info via our backend to avoid CORS issues
                const backendResponse = await axios.post(`${apiBase}/auth/google`, {
                    token: `access_token_${tokenResponse.access_token}`
                });

                if (backendResponse.data.user) {
                    // Normalize user object to match AuthContext expectation of 'sub'
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
        <div className="flex min-h-screen items-center justify-center bg-gray-900 relative overflow-hidden font-[Inter]">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]" />
            </div>

            <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Arc Wardens</h1>
                        <p className="text-gray-400 text-sm font-medium tracking-wide">Next-Gen Outreach Automation</p>
                    </div>

                    <div className="space-y-4">
                        {isGoogleConfigured ? (
                            <button
                                onClick={() => googleLogin()}
                                className="group w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </button>
                        ) : (
                            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 mb-2">
                                <p className="text-xs text-amber-200 text-center leading-relaxed font-medium">
                                    Google Auth not configured. Use Demo Login below.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                const mockToken = `mock_token_fixed_demo_user_123`;
                                login({ credential: mockToken }, 'mock_access_token');
                            }}
                            className={`w-full font-semibold py-3.5 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 
                                ${isGoogleConfigured
                                    ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                }`}
                        >
                            {isGoogleConfigured ? 'Dev Mode Login' : 'Start Live Demo'}
                            {!isGoogleConfigured && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/5 w-full">
                        <div className="flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Protected by Arc Defense</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
