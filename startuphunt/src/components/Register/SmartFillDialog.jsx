import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

const SmartFillDialog = ({
    open,
    pendingAIData,
    onCancel,
    onFillAll,
    onFillEmpty,
}) => {
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle>🤖 AI Data Generated</DialogTitle>
            <DialogContent>
                <div className="space-y-4">
                    <p className="text-gray-600">
                        AI has successfully extracted data from your website! How would you like to proceed?
                    </p>

                    {pendingAIData && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <h4 className="font-medium text-gray-800">Preview of AI-generated data:</h4>
                            {pendingAIData.name && <p><strong>Name:</strong> {pendingAIData.name}</p>}
                            {pendingAIData.tagline && <p><strong>Tagline:</strong> {pendingAIData.tagline}</p>}
                            {pendingAIData.category && <p><strong>Category:</strong> {pendingAIData.category}</p>}
                            {pendingAIData.features?.length > 0 && (
                                <p><strong>Tags:</strong> {pendingAIData.features.join(', ')}</p>
                            )}
                            {pendingAIData.logo_url && <p><strong>Logo:</strong> Found ✅</p>}
                            {pendingAIData.thumbnail_url && <p><strong>Screenshot:</strong> Generated ✅</p>}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                            <h5 className="font-medium text-blue-800">Fill All Fields</h5>
                            <p className="text-md text-blue-600">Replace existing data with AI-generated content</p>
                        </div>
                        <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                            <h5 className="font-medium text-green-800">Fill Empty Fields Only</h5>
                            <p className="text-md text-green-600">Keep your existing data, only fill empty fields</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">
                    Cancel
                </Button>
                <Button onClick={onFillEmpty} color="success" variant="contained">
                    Fill Empty Only
                </Button>
                <Button onClick={onFillAll} color="primary" variant="contained">
                    Fill All Fields
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SmartFillDialog;

