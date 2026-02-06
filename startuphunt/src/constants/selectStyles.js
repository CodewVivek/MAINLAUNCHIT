/**
 * Custom styles for react-select components
 */

export const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.5rem',
        padding: '0.25rem',
        backgroundColor: '#f9fafb', // Light gray background
        borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
        boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
        '&:hover': { borderColor: '#d1d5db' },
        fontSize: '0.875rem',
    }),
    singleValue: (provided) => ({ ...provided, color: '#1f2937' }),
    placeholder: (provided) => ({ ...provided, color: '#9ca3af' }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? '#eff6ff' : '#fff',
        color: state.isFocused ? '#2563eb' : '#1f2937',
        fontSize: '0.875rem',
    }),
};

