import React from 'react';

const FormTabs = ({ step, setStep }) => {
    return (
        <nav className="flex justify-center border-b border-gray-200 px-2 pt-1">
            <button
                type="button"
                onClick={() => setStep(1)}
                className={`tab-button ${step === 1 ? 'active' : ''}`}
            >
                Basic Info
            </button>
            <button
                type="button"
                onClick={() => setStep(2)}
                className={`px-6 py-3 -mb-px border-b-2 text-md font-semibold transition-colors duration-200
                    ${step === 2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Media & Images
            </button>
            <button
                type="button"
                onClick={() => setStep(3)}
                className={`px-6 py-3 -mb-px border-b-2 text-md font-semibold transition-colors duration-200
                    ${step === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Additional Details
            </button>
        </nav>
    );
};

export default FormTabs;

