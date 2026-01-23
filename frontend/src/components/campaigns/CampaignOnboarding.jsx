import { useState } from 'react';

export default function CampaignOnboarding() {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Arc Wardens",
            description: "The ultimate platform for intelligent outreach. We combine verified data sourcing with AI personalization to scale your campaigns effectively.",
            color: "text-indigo-600",
            bg: "bg-indigo-100",
            activeDot: "bg-indigo-600",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            )
        },
        {
            title: "How It Works",
            description: "Define your audience, review AI-drafted messages, and launch. It's that simple—we handle the infrastructure and deliverability.",
            color: "text-blue-600",
            bg: "bg-blue-100",
            activeDot: "bg-blue-600",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
        {
            title: "AI & Verification",
            description: "Our dual-engine system verifies every lead and crafts hyper-personalized emails, ensuring your value prop lands in the primary inbox.",
            color: "text-purple-600",
            bg: "bg-purple-100",
            activeDot: "bg-purple-600",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            )
        },
        {
            title: "Real-time Analytics",
            description: "Track performance instantly. Monitor open rates, replies, and engagement to continuously optimize your outreach strategy.",
            color: "text-orange-600",
            bg: "bg-orange-100",
            activeDot: "bg-orange-600",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        }
    ];

    const handleNext = () => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
    };

    const handlePrev = () => {
        setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    };

    const activeStep = steps[currentStep];

    return (
        <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in w-full max-w-3xl mx-auto px-4 relative">
            <div className="flex items-center w-full justify-between gap-4 md:gap-12">
                {/* Left Arrow */}
                <button
                    onClick={handlePrev}
                    className="p-3 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-all focus:outline-none"
                    aria-label="Previous step"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl ${activeStep.bg} ${activeStep.color} mb-6 flex items-center justify-center transition-colors duration-300`}>
                        {activeStep.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3 font-[Inter] tracking-tight transition-all duration-300">
                        {activeStep.title}
                    </h2>

                    <p className="text-gray-500 text-base leading-relaxed max-w-md h-12 transition-all duration-300">
                        {activeStep.description}
                    </p>

                    {/* Dots Indicator */}
                    <div className="flex gap-2 mt-12">
                        {steps.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === idx
                                        ? `w-6 ${activeStep.activeDot}`
                                        : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                                    }`}
                                aria-label={`Go to step ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Arrow */}
                <button
                    onClick={handleNext}
                    className="p-3 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-all focus:outline-none"
                    aria-label="Next step"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
