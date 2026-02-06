import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Sparkles, X, Check, ArrowRight } from 'lucide-react';

const SmartFillDialog = ({
    open,
    pendingAIData,
    onCancel,
    onFillAll,
    onFillEmpty
}) => {
    if (!pendingAIData) return null;

    return (
        <Dialog.Root open={open} onOpenChange={onCancel}>
            <Dialog.Portal>
                {/* Backdrop with blur */}
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />

                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl duration-200 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 border border-gray-100">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-200">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-bold text-gray-900">
                                    AI Data Ready
                                </Dialog.Title>
                                <Dialog.Description className="text-xs text-gray-500 font-medium">
                                    We found some great details for you!
                                </Dialog.Description>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Preview Section */}
                    <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 mb-6 space-y-3">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preview</h4>

                        {pendingAIData.name && (
                            <div className="flex items-start gap-3">
                                <div className="min-w-[70px] text-xs font-medium text-gray-500 mt-0.5">Name</div>
                                <div className="text-sm font-semibold text-gray-900">{pendingAIData.name}</div>
                            </div>
                        )}

                        {pendingAIData.tagline && (
                            <div className="flex items-start gap-3">
                                <div className="min-w-[70px] text-xs font-medium text-gray-500 mt-0.5">Tagline</div>
                                <div className="text-sm text-gray-700 leading-snug">{pendingAIData.tagline}</div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100">
                            {pendingAIData.logo_url && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                    <Check className="w-3 h-3" /> Logo Found
                                </div>
                            )}
                            {pendingAIData.thumbnail_url && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                    <Check className="w-3 h-3" /> Screenshot Ready
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={onFillAll}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                        >
                            <div className="text-left">
                                <div className="font-semibold text-indigo-900">Fill All Fields</div>
                                <div className="text-xs text-indigo-600 font-medium">Replace existing data with AI content</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </button>

                        <button
                            onClick={onFillEmpty}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all group"
                        >
                            <div className="text-left">
                                <div className="font-semibold text-gray-900">Fill Empty Only</div>
                                <div className="text-xs text-gray-500 font-medium">Keep your current data</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-gray-200 transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>
                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default SmartFillDialog;
