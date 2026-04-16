'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import {signInWithEmail} from "@/lib/actions/auth.actions";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/better-auth/client";

const SignIn = () => {
    const router = useRouter()
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signInWithEmail(data);
            if(result.success) router.push('/');
        } catch (e) {
            console.error(e);
            toast.error('Sign in failed', {
                description: e instanceof Error ? e.message : 'Failed to sign in.'
            })
        }
    }

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            const { error } = await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
            });

            if (error) {
                toast.error("Google sign in failed", {
                    description: error.message || "Check your Google OAuth configuration.",
                });
            }
        } catch (e) {
            console.error(e);
            toast.error("Google sign in failed", {
                description: e instanceof Error ? e.message : "Please try again.",
            });
            setIsGoogleLoading(false);
        }
    };

    return (
        <>
            <h1 className="form-title">Welcome back</h1>
            <p className="form-subtitle">Track your watchlist, alerts, and market news from one clean workspace.</p>

            <Button
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignIn}
                className="social-btn w-full mb-5"
            >
                <span className="google-mark">G</span>
                {isGoogleLoading ? "Opening Google" : "Continue with Google"}
            </Button>

            <div className="auth-divider">
                <span>or sign in with email</span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="auth-form-stack">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@jsmastery.com"
                    register={register}
                    error={errors.email}
                    validation={{ required: 'Email is required', pattern: /^\w+@\w+\.\w+$/ }}
                />

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Signing In' : 'Sign In'}
                </Button>

                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />
            </form>
        </>
    );
};
export default SignIn;
