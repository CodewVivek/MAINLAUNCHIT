'use client';

import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import EmailLogin from "@/components/EmailLogin";
import toast from "react-hot-toast";

export default function UserRegister() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [showOTP, setShowOTP] = useState(false);
    const [realMakers, setRealMakers] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchMakers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, username')
                .not('avatar_url', 'is', null)
                .limit(10);
            if (data) setRealMakers(data);
        };
        fetchMakers();
    }, []);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError("");
        try {
            toast.loading('Redirecting to Google...', { id: 'google-signin' });
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/?signed_in=1` },
            });
            if (error) throw error;
        } catch (err) {
            toast.dismiss('google-signin');
            setError(err.message);
            toast.error(err.message || "Failed to sign in with Google");
            setLoading(false);
        }
    };

    const handleEmailSignIn = async (e) => {
        e?.preventDefault();
        if (!email || !email.includes('@')) {
            setError("Please enter a valid email address");
            toast.error("Please enter a valid email address");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase().trim(),
                options: { shouldCreateUser: true }
            });
            if (error) throw error;

            toast.success("Verification code sent to your email!", {
                icon: '📧',
                duration: 4000
            });
            setShowOTP(true);
        } catch (err) {
            setError('');
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) router.push("/");
        };
        checkUser();
    }, [router]);

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden relative flex flex-col justify-center">

            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-white blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center px-1 sm:px-6 lg:px-8 relative z-10">

                {/* Left Side: Social Proof */}
                <div className="hidden lg:flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5" />
                            Trusted by 300+ Builders
                        </div>
                        <h1 className="text-5xl font-black leading-[1.1] tracking-tight">
                            Get your <span className="text-blue-600">startup</span> in front of real users.
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-lg font-medium leading-relaxed">
                            Join 300+ makers shipping their projects and growing their audience. No noise, just visibility.
                        </p>
                    </div>

                    {/* Real Testimonials */}
                    <div className="grid gap-3">
                        {[
                            {
                                name: "Local Mama",
                                role: "@localmama4u",
                                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mama",
                                content: "Really I thank you mana I got first 100 viewers from your site. Wishing you all the best ❤️",
                            },
                            {
                                name: "Alex Cloudstar",
                                role: "@alexcloudstar",
                                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
                                content: "Launchit is a gem for getting early eyeballs on your product. Seen some cool stuff pop up there.",
                            }
                        ].map((t, idx) => (
                            <div key={idx} className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm relative group hover:shadow-md transition-all">
                                <p className="text-muted-foreground text-sm italic mb-4 leading-relaxed">"{t.content}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full border border-border overflow-hidden">
                                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">{t.name}</div>
                                        <div className="text-xs text-primary/80 font-medium">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Social Proof Avatars (Real Data) */}
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-3">
                            {realMakers.slice(0, 5).map((maker, i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                                    <img
                                        src={maker.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${maker.username}`}
                                        alt={maker.full_name}
                                        title={maker.full_name}
                                    />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                                +30
                            </div>
                        </div>
                        <div className="h-8 w-[1px] bg-border" />
                        <div>
                            <div className="text-sm font-black">Growing Community</div>
                            <div className="text-xs text-muted-foreground">300+ makers already launched</div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="w-full flex justify-center">
                    <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
                        {/* Mobile Header */}
                        <div className="text-center mb-8 lg:hidden">
                            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
                            <h2 className="text-3xl font-black tracking-tight">Welcome to Launchit</h2>
                            <p className="mt-2 text-muted-foreground font-medium">Ship your projects and get discovered today.</p>
                        </div>

                        <div className="bg-card border border-border py-8 px-6 shadow-xl sm:rounded-[32px] sm:px-10 relative overflow-hidden group">

                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-black tracking-tight">{showOTP ? "Verify Email" : "Create Account"}</h2>
                                <p className="text-sm text-muted-foreground mt-1">Join the community in seconds.</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {!showOTP ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full h-12 px-4 rounded-xl bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-2">
                                        <button
                                            onClick={handleEmailSignIn}
                                            disabled={loading}
                                            className="w-full h-12 bg-background border-2 border-primary text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-all disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue with Email"}
                                        </button>

                                        <div className="flex items-center gap-4 py-2">
                                            <div className="h-[1px] flex-grow bg-border" />
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">or</span>
                                            <div className="h-[1px] flex-grow bg-border" />
                                        </div>

                                        <button
                                            onClick={handleGoogleSignIn}
                                            disabled={loading}
                                            className="w-full h-12 bg-background border border-border rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-muted transition-all disabled:opacity-50"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Continue with Google
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-muted p-4 rounded-xl border border-border text-center">
                                        <p className="text-sm text-muted-foreground font-medium">OTP sent to {email}</p>
                                        <button onClick={() => setShowOTP(false)} className="text-primary text-xs font-bold mt-1">Change email</button>
                                    </div>
                                    <EmailLogin initialStep="verify" initialEmail={email} onBack={() => setShowOTP(false)} />
                                </div>
                            )}

                            <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> No gatekeeping</span>
                                <div className="w-1 h-1 bg-border rounded-full" />
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Instant visibility</span>
                            </div>
                        </div>

                        {/* Mobile Testimonial */}
                        <div className="lg:hidden mt-8">
                            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-muted">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mama" alt="Maker" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold">Local Mama</div>
                                        <div className="text-[10px] text-primary font-medium">@localmama4u</div>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-[13px] leading-relaxed italic">"I got my first 100 viewers from Launchit. Best platform for indie makers."</p>
                            </div>
                        </div>

                        {/* Footer Links */}
                        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Agree to{" "}
                            <a href="/terms" className="text-primary hover:underline underline-offset-4">Terms</a>{" "}
                            &{" "}
                            <a href="/privacy" className="text-primary hover:underline underline-offset-4">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}