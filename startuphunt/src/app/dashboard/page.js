'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const subscriptionId = searchParams.get('subscription_id');
    const status = searchParams.get('status');
    const payment = searchParams.get('payment');

    useEffect(() => {
        if (payment === 'success' || status === 'active') {
            const timer = setTimeout(() => router.push('/my-launches'), 2000);
            return () => clearTimeout(timer);
        }
    }, [payment, status, router]);

    const isSuccess = payment === 'success' || status === 'active';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                {isSuccess ? (
                    <>
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Your subscription has been activated. Redirecting to your launches...
                        </p>
                        {subscriptionId && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                                Subscription ID: {subscriptionId}
                            </p>
                        )}
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Redirecting...</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Status Unknown
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We couldn&apos;t determine your payment status. Please check your account.
                        </p>
                        <button
                            onClick={() => router.push('/my-launches')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Go to My Launches
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function DashboardFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardFallback />}>
            <DashboardContent />
        </Suspense>
    );
}
