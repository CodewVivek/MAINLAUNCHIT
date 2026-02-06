import React from 'react';
import Select from 'react-select';
import { Wand2, Eye, CheckCircle } from 'lucide-react';
import { customSelectStyles } from '../../constants/selectStyles';
import { isValidUrl } from '../../utils/registerUtils';

const BasicInfoStep = ({
    formData,
    handleInputChange,
    handleTaglineChange,
    handleDescriptionChange,
    taglineCharCount,
    descriptionWordCount,
    DESCRIPTION_WORD_LIMIT,
    selectedCategory,
    setSelectedCategory,
    dynamicCategoryOptions,
    urlError,
    handleUrlBlur,
    editingLaunched,
    handleGenerateLaunchData,
    isAILoading,
    isRetrying,
    generateBasicPreview,
    urlPreview,
    isGeneratingPreview,
}) => {
    return (
        <div className="form-tab-panel active">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-field-group">
                        <label className="form-label" htmlFor="name">
                            Name of the launch <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="form-input"
                            maxLength={30}
                            disabled={editingLaunched}
                            placeholder='e.g launchit'
                        />
                        <div className="text-sm text-gray-400 text-right mt-1">{formData.name.length} / 30</div>
                    </div>
                    <div className="form-field-group">
                        <label className="form-label" htmlFor="websiteUrl">
                            Website URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="websiteUrl"
                            name="websiteUrl"
                            value={formData.websiteUrl}
                            onChange={handleInputChange}
                            onBlur={handleUrlBlur}
                            className={`form-input ${urlError ? 'border-red-500' : ''}`}
                            placeholder="https://yourproject.com"
                            disabled={editingLaunched}
                        />
                        {urlError && <p className="text-red-500 text-md mt-1">{urlError}</p>}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleGenerateLaunchData}
                                disabled={isAILoading || isRetrying}
                                className={`btn-text-icon ${isAILoading || isRetrying ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isAILoading || isRetrying ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4" />
                                        Auto-generate from URL
                                    </>
                                )}
                            </button>

                            {!urlPreview && !isGeneratingPreview && (
                                <button
                                    type="button"
                                    onClick={() => generateBasicPreview(formData.websiteUrl)}
                                    disabled={isGeneratingPreview || !formData.websiteUrl}
                                    className="btn-text-icon-secondary"
                                    title="Generate basic preview if AI fails"
                                >
                                    {isGeneratingPreview ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                            Preview...
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4" />
                                            Basic Preview
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {urlPreview && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-md font-medium text-green-800">
                                        Basic preview available from {urlPreview.domain}
                                    </span>
                                </div>
                                <div className="text-sm text-green-700">
                                    <p><strong>Title:</strong> {urlPreview.title}</p>
                                    <p><strong>Description:</strong> {urlPreview.description}</p>
                                    {urlPreview.logo && <p><strong>Logo:</strong> ✓ Found</p>}
                                    {urlPreview.screenshot && <p><strong>Screenshot:</strong> ✓ Found</p>}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="form-field-group">
                        <label className="form-label" htmlFor="tagline">
                            Tagline <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="tagline"
                            name="tagline"
                            value={formData.tagline}
                            onChange={handleTaglineChange}
                            className="form-input"
                            maxLength={60}
                            placeholder="catchy tagline of what the launch does."
                        />
                        <div className="text-sm text-gray-400 text-right mt-1">{taglineCharCount} / 60</div>
                    </div>
                    <div className="form-field-group">
                        <label className="form-label" htmlFor="category">
                            Category(ies) <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={dynamicCategoryOptions}
                            isClearable={true}
                            isSearchable={true}
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            styles={customSelectStyles}
                            placeholder="Select a category"
                        />
                    </div>
                    <div className="form-field-group md:col-span-2">
                        <label className="form-label" htmlFor="description">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            rows={4}
                            className="form-input"
                            placeholder="Describe your launch in detail. What problem does it solve? What makes it unique?"
                        />
                        <div className="text-sm text-gray-400 text-right mt-1">{descriptionWordCount} / {DESCRIPTION_WORD_LIMIT}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicInfoStep;

