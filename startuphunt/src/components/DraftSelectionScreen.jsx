import React, { useState, useEffect } from 'react';
import { Plus, Clock, Trash2, ExternalLink, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';
import { supabase } from '../supabaseClient'; // if you need supabase here; remove if not

/**
 * DraftSelectionScreen
 * Props:
 *  - user
 *  - drafts (array) [optional: if you want parent-controlled list]
 *  - loading (bool)
 *  - onContinueDraft(draftId)
 *  - onStartNew()  <-- IMPORTANT: when called it should reset form and navigate to /submit
 *  - onDismiss() optional
 */
const DraftSelectionScreen = ({ user, drafts: propDrafts = [], loading: propLoading = false, onContinueDraft, onStartNew, onDismiss }) => {
  const [drafts, setDrafts] = useState(propDrafts);
  const [loading, setLoading] = useState(propLoading);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, draftId: null, draftName: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const router = useRouter();

  useEffect(() => setDrafts(propDrafts), [propDrafts]);
  useEffect(() => setLoading(propLoading), [propLoading]);

  useEffect(() => {
    if (!loading && drafts.length === 0 && typeof onDismiss === 'function') {
      onDismiss();
    }
  }, [loading, drafts, onDismiss]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    const opts = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
    return date.toLocaleDateString('en-US', opts);
  };

  const handleContinue = (id) => {
    if (typeof onContinueDraft === 'function') return onContinueDraft(id);
    return router.push(`/submit?draft=${id}`);
  };

  const handleDeleteClick = (draftId, draftName) => setDeleteDialog({ open: true, draftId, draftName });

  const handleDeleteConfirm = async () => {
    const { draftId } = deleteDialog;
    if (!draftId || !user) {
      setDeleteDialog({ open: false, draftId: null, draftName: null });
      return;
    }

    try {
      // Delete from backend
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', draftId)
        .eq('user_id', user.id)
        .eq('status', 'draft');

      if (error) throw error;

      // Update local list and decide next action
      setDrafts(prev => {
        const next = prev.filter(d => d.id !== draftId);

        // If no drafts left, prefer parent's onStartNew (it resets form and navigates to /submit).
        // Fallback: navigate to /submit directly.
        if (next.length === 0) {
          if (typeof onStartNew === 'function') {
            try { onStartNew(); } catch (e) { router.push('/submit'); }
          } else {
            router.push('/submit');
          }
        }

        return next;
      });

      setSnackbar({ open: true, message: 'Draft deleted successfully', severity: 'success' });
      setDeleteDialog({ open: false, draftId: null, draftName: null });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete draft', severity: 'error' });
      setDeleteDialog({ open: false, draftId: null, draftName: null });
    }
  };

  const handleDeleteCancel = () => setDeleteDialog({ open: false, draftId: null, draftName: null });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your drafts...</p>
        </div>
      </div>
    );
  }

  if (!drafts || drafts.length === 0) return null;

  return (
    <div className="min-h-screen font-sans antialiased text-gray-800 bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit Your Launch</h1>
          <p className="text-gray-500">Continue your existing draft or start a new submission</p>
        </header>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your existing in progress posts:</h2>

          <div className="space-y-4">
            {drafts.map(draft => (
              <div key={draft.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      {draft.logo_url || draft.thumbnail_url ? (
                        <img
                          src={draft.logo_url || draft.thumbnail_url}
                          alt={draft.name ? `${draft.name} logo` : 'Draft logo'}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Rocket className="w-6 h-6 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">{draft.name || 'Untitled Draft'}</h3>
                        {draft.website_url && (
                          <div className="flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                            <p className="text-md text-gray-500 truncate">{draft.website_url}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {draft.tagline && <p className="text-gray-600 mb-2 text-md">{draft.tagline}</p>}
                    {draft.description && <p className="text-md text-gray-500 line-clamp-2 mb-3">{draft.description}</p>}

                    <div className="flex items-center gap-4 flex-wrap text-sm text-gray-400">
                      {draft.category_type && <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">{draft.category_type}</span>}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last updated: {formatDate(draft.updated_at || draft.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleContinue(draft.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-md whitespace-nowrap">
                      Continue
                    </button>
                    <button onClick={() => handleDeleteClick(draft.id, draft.name || 'Untitled Draft')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete draft" aria-label={`Delete draft ${draft.name || 'Untitled Draft'}`}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button onClick={() => (typeof onStartNew === 'function' ? onStartNew() : router.push('/submit'))} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            <Plus className="w-5 h-5" />
            Start New Submission
          </button>
        </div>
      </div>

      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Draft</DialogTitle>
        <DialogContent>
          <p className="text-gray-600 mb-4">Are you sure you want to delete "{deleteDialog.draftName}"? This action cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
};

DraftSelectionScreen.propTypes = {
  user: PropTypes.object,
  drafts: PropTypes.array,
  loading: PropTypes.bool,
  onContinueDraft: PropTypes.func,
  onStartNew: PropTypes.func,
  onDismiss: PropTypes.func,
};

export default DraftSelectionScreen;
