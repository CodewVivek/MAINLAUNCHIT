export const applyAIData = ({
    gptData = {},
    onlyEmptyFields = false,
    setFormData,
    setLinks,
    links = [],
    setLogoFile,
    logoFile,
    setThumbnailFile,
    thumbnailFile,
    setTags,
    tags = [],
    setSelectedCategory,
    selectedCategory,
    dynamicCategoryOptions = [],
    setDynamicCategoryOptions,
    mergeLinks = false,    // optional: if true merge safe links instead of replacing
    mergeTags = false      // optional: if true merge features/tags instead of replacing
}) => {
    // Defensive defaults
    const safeGpt = gptData || {};

    // 1) Update form data (functional update to avoid stale state)
    setFormData(prev => ({
        ...prev,
        name: onlyEmptyFields ? (prev.name || safeGpt.name || "") : (safeGpt.name || prev.name || ""),
        websiteUrl: onlyEmptyFields ? (prev.websiteUrl || safeGpt.website_url || "") : (safeGpt.website_url || prev.websiteUrl || ""),
        tagline: onlyEmptyFields ? (prev.tagline || safeGpt.tagline || "") : (safeGpt.tagline || prev.tagline || ""),
        description: onlyEmptyFields ? (prev.description || safeGpt.description || "") : (safeGpt.description || prev.description || "")
    }));

    // 2) Links: accept string or array; validate basic string shape and filter empties
    const incomingLinks = [];
    if (safeGpt.links) {
        if (Array.isArray(safeGpt.links)) {
            incomingLinks.push(...safeGpt.links);
        } else if (typeof safeGpt.links === 'string' && safeGpt.links.trim()) {
            incomingLinks.push(safeGpt.links);
        }
    }
    const safeLinks = incomingLinks
        .map(l => typeof l === 'string' ? l.trim() : '')
        .filter(Boolean);

    // Only set links when we should (respect onlyEmptyFields)
    const shouldSetLinks = safeLinks.length > 0 && (!onlyEmptyFields || !Array.isArray(links) || links.length === 0 || (links.length <= 1 && !links[0]));

    if (shouldSetLinks) {
        if (mergeLinks && Array.isArray(links) && links.length) {
            // merge preserving existing then adding new ones (de-duped)
            const merged = Array.from(new Set([...links.filter(Boolean), ...safeLinks]));
            setLinks(merged);
        } else {
            setLinks(safeLinks);
        }
    }

    // 3) Logo
    if (safeGpt.logo_url && (!onlyEmptyFields || !logoFile)) {
        // optionally validate URL format here
        setLogoFile(safeGpt.logo_url);
    }

    // 4) Thumbnail (screenshot / OG)
    if (safeGpt.thumbnail_url && (!onlyEmptyFields || !thumbnailFile)) {
        setThumbnailFile(safeGpt.thumbnail_url);
    }

    // 5) Tags / features
    const incomingFeatures = Array.isArray(safeGpt.features) ? safeGpt.features : [];
    const safeFeatures = incomingFeatures
        .map(f => typeof f === 'string' ? f.trim() : '')
        .filter(Boolean);

    if (safeFeatures.length > 0 && (!onlyEmptyFields || (Array.isArray(tags) && tags.length === 0))) {
        if (mergeTags && Array.isArray(tags) && tags.length) {
            const mergedTags = Array.from(new Set([...tags, ...safeFeatures])).slice(0, 5);
            setTags(mergedTags);
        } else {
            setTags(safeFeatures.slice(0, 5)); // Limit AI-generated tags to 5
        }
    }

    // 6) Category detection — normalize and robust checks
    const incomingCategory = typeof safeGpt.category === 'string' ? safeGpt.category.trim() : '';
    if (incomingCategory && (!onlyEmptyFields || !selectedCategory)) {
        const normalizedIncoming = incomingCategory.toLowerCase();

        const findOption = (opt) => {
            const value = (opt && opt.value) ? String(opt.value).toLowerCase() : '';
            const label = (opt && opt.label) ? String(opt.label).toLowerCase() : '';
            return value === normalizedIncoming || label.includes(normalizedIncoming);
        };

        // Safely flatten options (guard against missing shape)
        const flatOptions = Array.isArray(dynamicCategoryOptions)
            ? dynamicCategoryOptions.flatMap(group => Array.isArray(group?.options) ? group.options : [])
            : [];

        let categoryOption = flatOptions.find(findOption);

        if (!categoryOption) {
            // Create a clean value
            const safeValue = normalizedIncoming.replace(/[^\w\-]+/g, '-').replace(/\-+/g, '-').replace(/^\-|\-$/g, '') || incomingCategory.toLowerCase().replace(/\s+/g, '-');

            categoryOption = {
                value: safeValue,
                label: incomingCategory,
                isNew: true
            };

            // Add to dynamic options using functional setter to avoid stale state and prevent mutation
            setDynamicCategoryOptions(prevGroups => {
                // make a shallow copy of groups and options to avoid mutation
                const groups = Array.isArray(prevGroups) ? prevGroups.map(g => ({ ...g, options: Array.isArray(g.options) ? [...g.options] : [] })) : [];

                const existingIndex = groups.findIndex(g => g.label === "🧪 Emerging Technologies" || g.label === "🤖 AI-Detected Categories");

                if (existingIndex !== -1) {
                    groups[existingIndex].options.push(categoryOption);
                } else {
                    groups.push({
                        label: "🤖 AI-Detected Categories",
                        options: [categoryOption]
                    });
                }

                return groups;
            });
        }

        if (categoryOption) {
            setSelectedCategory(categoryOption);
        }
    }
};

