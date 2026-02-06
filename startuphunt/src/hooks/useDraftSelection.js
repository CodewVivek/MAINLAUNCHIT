import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useDraftSelection = (user, projectLoaded, searchParams) => {
    const [showDraftSelection, setShowDraftSelection] = useState(false);
    const [userDrafts, setUserDrafts] = useState([]);
    const [loadingDrafts, setLoadingDrafts] = useState(false);

    useEffect(() => {
        const editId = searchParams.get('edit');
        const draftId = searchParams.get('draft');

        const fetchUserDrafts = async () => {
            if (!user) return;
            if (editId || draftId) return;

            setLoadingDrafts(true);
            try {
                const { data: drafts, error } = await supabase
                    .from('projects')
                    .select('id, name, website_url, tagline, description, category_type, created_at, updated_at, logo_url, thumbnail_url')
                    .eq('user_id', user.id)
                    .eq('status', 'draft')
                    .order('updated_at', { ascending: false });

                if (error) {
                    setUserDrafts([]);
                } else {
                    const meaningfulDrafts = (drafts || []).filter(draft =>
                        draft.name || draft.website_url || draft.tagline || draft.description || draft.category_type
                    );
                    setUserDrafts(meaningfulDrafts);
                    if (meaningfulDrafts.length > 0) {
                        setShowDraftSelection(true);
                    }
                }
            } catch (error) {
                setUserDrafts([]);
            } finally {
                setLoadingDrafts(false);
            }
        };

        if (user && !projectLoaded) {
            fetchUserDrafts();
        }
    }, [user, projectLoaded, searchParams]);

    return { showDraftSelection, setShowDraftSelection, userDrafts, loadingDrafts };
};

