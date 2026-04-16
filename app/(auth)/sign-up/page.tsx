'use client';
import React, { useState } from 'react'
import {useForm} from "react-hook-form";
import InputField from "@/components/forms/InputField";

import {Button} from "@/components/ui/button";
import {INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS} from "@/lib/constants";
import SelectField from "@/components/forms/SelectField";
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import {useRouter} from "next/navigation";
import {signUpWithEmail} from "@/lib/actions/auth.actions";
import {toast} from "sonner";
import {authClient} from "@/lib/better-auth/client";
import {Upload, X} from "lucide-react";

const SignUp = () => {

    const router = useRouter();
    const [profileImage, setProfileImage] = useState<string>("");
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
            defaultValues: {
                fullName: '',
                email: '',
                password: '',
                country: 'US',
                investmentGoals: 'Growth',
                riskTolerance: 'Medium',
                preferredIndustry: 'Technology'
            },
            mode: 'onBlur'
        },);

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

    const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file.");
            event.target.value = "";
            return;
        }

        if (file.size > 512 * 1024) {
            toast.error("Image is too large", {
                description: "Choose a profile photo under 512 KB.",
            });
            event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setProfileImage(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithEmail({ ...data, image: profileImage || undefined });
            if(result.success) router.push('/');
        } catch (e) {
            console.error(e);
            toast.error('Sign up failed', {
                description: e instanceof Error ? e.message : 'Failed to create an account.'
            })
        }
    }

    return (
        <>
            <h1 className="form-title">Sign Up & Personalize</h1>
            <p className="form-subtitle">Set up your Marketly profile so your dashboard and email summaries feel tailored from day one.</p>

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
                <span>or sign up with email</span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="auth-form-stack">
                <div className="profile-upload-field">
                    <label htmlFor="profileImage" className="profile-upload-label">
                        <span className="profile-upload-preview">
                            {profileImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profileImage} alt="Profile preview" className="profile-upload-image" />
                            ) : (
                                <Upload className="h-5 w-5" />
                            )}
                        </span>
                        <span className="profile-upload-copy">
                            <span className="profile-upload-title">Upload profile photo</span>
                            <span className="profile-upload-description">PNG or JPG under 512 KB</span>
                        </span>
                    </label>
                    <input
                        id="profileImage"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={handleProfileImageChange}
                    />
                    {profileImage && (
                        <button
                            type="button"
                            onClick={() => setProfileImage("")}
                            className="profile-upload-remove"
                            aria-label="Remove selected profile photo"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="auth-form-grid">
                    <InputField
                        name="fullName"
                        label="Full Name"
                        placeholder="John Doe"
                        register={register}
                        error={errors.fullName}
                        validation={{ required: 'Full name is required', minLength: 2 }}
                    />

                    <InputField
                        name="email"
                        label="Email"
                        placeholder="contact@jsmastery.com"
                        register={register}
                        error={errors.email}
                        validation={{ required: 'Email name is required', pattern: /^\w+@\w+\.\w+$/, message: 'Email address is required' }}
                    />
                </div>

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter a strong password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />

                <CountrySelectField
                    name="country"
                    label="Country"
                    control={control}
                    error={errors.country}
                    required
                />

                <div className="auth-form-grid">
                    <SelectField
                        name="investmentGoals"
                        label="Investment Goals"
                        placeholder="Select your investment goal"
                        options={INVESTMENT_GOALS}
                        control={control}
                        error={errors.investmentGoals}
                        required
                    />

                    <SelectField
                        name="riskTolerance"
                        label="Risk Tolerance"
                        placeholder="Select your risk level"
                        options={RISK_TOLERANCE_OPTIONS}
                        control={control}
                        error={errors.riskTolerance}
                        required
                    />
                </div>

                <SelectField
                    name="preferredIndustry"
                    label="Preferred Industry"
                    placeholder="Select your preferred industry"
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Creating Account' : 'Start Your Investing Journey'}
                </Button>

                <FooterLink text="Already have an account?" linkText="Sign in" href="/sign-in" />

            </form>

        </>
    )
}
export default SignUp;
