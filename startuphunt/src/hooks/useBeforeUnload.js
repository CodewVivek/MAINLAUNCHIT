import { useEffect } from 'react';
import { isFormEmpty } from '../utils/formValidation';

export const useBeforeUnload = (hasUnsavedChanges, formData, selectedCategory) => {
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges && !isFormEmpty(formData, selectedCategory)) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, formData, selectedCategory]);
};

