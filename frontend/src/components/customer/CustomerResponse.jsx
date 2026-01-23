import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

const CustomerResponse = () => {
    const [email, setEmail] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [response, setResponse] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Parse query params
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        const campaignIdParam = params.get('campaignId');

        if (emailParam) setEmail(emailParam);
        if (campaignIdParam) setCampaignId(campaignIdParam);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!response.trim()) return;

        setLoading(true);
        setError('');

        try {
            await axios.post(`${API_BASE}/response`, {
                email,
                campaignId,
                response
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting response:', err);
            setError('Failed to submit response. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <h2 className="text-2xl font-bold text-green-600 mb-4">Response Sent!</h2>
                        <p className="text-gray-600">Thank you for your feedback. We have received your response.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Reply to Campaign
                </h2>
                {email && (
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Replying as <span className="font-medium text-gray-900">{email}</span>
                    </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                                Your Response
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="response"
                                    name="response"
                                    rows="4"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Type your reply here..."
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm">{error}</div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Sending...' : 'Send Response'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerResponse;
