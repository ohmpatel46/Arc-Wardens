import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID &&
        import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

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
                            <div className="w-full">
                                <GoogleLogin
                                    onSuccess={login}
                                    onError={() => {
                                        console.log('Login Failed');
                                        alert('Login Failed');
                                    }}
                                    useOneTap
                                    theme="filled_blue"
                                    shape="pill"
                                    width="350"
                                />
                            </div>
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
                                login({ credential: mockToken });
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
