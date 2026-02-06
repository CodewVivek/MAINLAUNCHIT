import React from 'react';

const FormActions = ({ step, setStep, handleSaveDraft, handleSubmit, isSubmitting = false, isSavingDraft = false }) => {
    return (
        <div className="form-actions-bar">
            {step > 1 && (
                <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="btn-secondary"
                    disabled={isSubmitting}
                >
                    Previous
                </button>
            )}
            <div className="ml-auto flex gap-4">
                <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="btn-tertiary"
                    disabled={isSubmitting || isSavingDraft}
                >
                    {isSavingDraft ? "Saving..." : "Save as Draft"}
                </button>
                {step < 3 ? (
                    <button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        Next
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-primary"
                    >
                        {isSubmitting ? "Launching..." : "Submit Launch"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FormActions;

