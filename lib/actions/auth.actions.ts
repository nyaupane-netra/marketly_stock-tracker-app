'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";
// import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry, image }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName, image } })

        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign up failed' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}

export const updateUserProfile = async ({ name, phoneNumber, image }: UpdateProfileFormData) => {
    try {
        await auth.api.updateUser({
            headers: await headers(),
            body: {
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),
                image: image || null,
            },
        });

        return { success: true };
    } catch (e) {
        console.log('Profile update failed', e);
        return { success: false, error: 'Profile update failed' };
    }
}

export const changeUserPassword = async ({ currentPassword, newPassword }: ChangePasswordFormData) => {
    try {
        await auth.api.changePassword({
            headers: await headers(),
            body: {
                currentPassword,
                newPassword,
                revokeOtherSessions: false,
            },
        });

        return { success: true };
    } catch (e) {
        console.log('Password update failed', e);
        return { success: false, error: 'Password update failed. Check your current password and try again.' };
    }
}
