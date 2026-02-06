import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailLogin = ({ initialStep = 'email', initialEmail = '', onBack }) => {
    const [step, setStep] = useState(initialStep); // 'email' or 'verify'
    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Sync email if initialEmail changes
    useEffect(() => {
        if (initialEmail) setEmail(initialEmail);
    }, [initialEmail]);

    // Handle sending OTP
    const handleSendOTP = async (e) => {
        e?.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase().trim(),
                options: {
                    shouldCreateUser: true,
                }
            });

            if (error) throw error;

            toast.success('OTP sent to your email!', {
                duration: 5000,
                icon: '📧',
            });
            setStep('verify');
            startResendCooldown();
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP input change
    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }

        if (index === 5 && value) {
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                handleVerifyOTP(fullOtp);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            handleVerifyOTP(pastedData);
        }
    };

    const handleVerifyOTP = async (code) => {
        const otpCode = code || otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email: email.toLowerCase().trim(),
                token: otpCode,
                type: 'email'
            });

            if (error) throw error;

            toast.success('Successfully logged in!', { icon: '✅' });
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } catch (error) {
            setOtp(['', '', '', '', '', '']);
            document.getElementById('otp-0')?.focus();
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startResendCooldown = () => {
        setResendCooldown(60);
        const interval = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendOTP = () => {
        if (resendCooldown > 0) return;
        handleSendOTP();
    };

    return (
        <div className="w-full">
            {step === 'email' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">Sign in with Email</h2>
                        <p className="text-sm text-muted-foreground">We'll send you a verification code</p>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full h-12 px-4 rounded-xl bg-muted border border-border focus:border-primary outline-none transition-all font-medium"
                            required
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                    </button>

                    {onBack && (
                        <button type="button" onClick={onBack} className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                            Go Back
                        </button>
                    )}
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-muted border border-border rounded-xl focus:border-primary outline-none transition-all"
                                disabled={loading}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => handleVerifyOTP()}
                        disabled={loading || otp.join('').length !== 6}
                        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                    </button>

                    <div className="text-center">
                        <button
                            onClick={handleResendOTP}
                            disabled={resendCooldown > 0}
                            className="text-xs font-bold text-muted-foreground hover:text-primary disabled:opacity-50"
                        >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailLogin;
