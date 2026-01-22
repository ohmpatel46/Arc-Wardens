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
            // tokenResponse.access_token is the one we need for Gmail

            // We still need the ID token if we want to use the current verify_google_token backend logic.
            // However, useGoogleLogin doesn't return an ID token by default in the 'implicit' flow.
            // We can fetch user info using the access token.
            try {
                const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });

                // For the backend to work as is, it expects a JWT. 
                // Let's create a "synthetic" token or just update the backend to accept access tokens.
                // But simpler is to use the access token to get user data and pass it.
                // However, the backend verify_google_token uses google-auth library verifying JWT.

                // Let's pass the access_token and let the backend handle it.
                // For now, we'll use a mock JWT for identity or just pass access_token as the main token if we update backend.

                login({ credential: `access_token_${tokenResponse.access_token}` }, tokenResponse.access_token, userInfo.data);
            } catch (err) {
                console.error('Error fetching user info:', err);
            }
        },
        onError: (error) => console.log('Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    });

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    Arc Wardens
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500 font-medium lowercase tracking-wide">
                    AI-Powered Sales Outreach
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
                <div className="bg-white py-8 px-8 shadow-xl border border-gray-100 rounded-3xl flex flex-col">
                    <div className="w-full space-y-4">
                        {isGoogleConfigured ? (
                            <button
                                onClick={() => googleLogin()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-3 shadow-md"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                    />
                                </svg>
                                Sign in with Google
                            </button>
                        ) : (
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-2">
                                <p className="text-xs text-amber-700 text-center leading-relaxed">
                                    Google Auth is not configured. Use <strong>Demo Login</strong> to explore the app immediately.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                const mockToken = `mock_token_${Date.now()}_demo_user`;
                                login({ credential: mockToken }, 'mock_access_token');
                            }}
                            className={`w-full font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-sm ${isGoogleConfigured
                                ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {!isGoogleConfigured && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                            {isGoogleConfigured ? 'Mock Login (Dev Mode)' : 'Start Demo Login'}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 w-full">
                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                            Powered by Circle & Google Cloud
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
