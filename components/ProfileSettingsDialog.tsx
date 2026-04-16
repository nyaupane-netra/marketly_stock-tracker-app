"use client";

import React, { ChangeEvent, FormEvent, useState, useTransition } from "react";
import { Camera, KeyRound, Phone, Save, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { changeUserPassword, updateUserProfile } from "@/lib/actions/auth.actions";

const MAX_PROFILE_IMAGE_SIZE = 512 * 1024;

const ProfileSettingsDialog = ({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (open: boolean) => void }) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(user.name);
    const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
    const [profileImage, setProfileImage] = useState(user.image || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setName(user.name);
            setPhoneNumber(user.phoneNumber || "");
            setProfileImage(user.image || "");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }

        onOpenChange(nextOpen);
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_PROFILE_IMAGE_SIZE) {
            toast.error("Image is too large", {
                description: "Choose a profile photo under 512 KB.",
            });
            event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setProfileImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name.trim()) {
            toast.error("Name is required.");
            return;
        }

        startTransition(async () => {
            const result = await updateUserProfile({
                name,
                phoneNumber,
                image: profileImage || null,
            });

            if (!result?.success) {
                toast.error(result?.error || "Profile update failed");
                return;
            }

            toast.success("Profile updated");
            router.refresh();
        });
    };

    const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Fill out all password fields.");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("New password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        startTransition(async () => {
            const result = await changeUserPassword({
                currentPassword,
                newPassword,
            });

            if (!result?.success) {
                toast.error(result?.error || "Password update failed");
                return;
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Password updated");
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="profile-dialog">
                <DialogHeader>
                    <DialogTitle className="profile-dialog-title">Profile settings</DialogTitle>
                    <DialogDescription className="profile-dialog-description">
                        Keep your Marketly profile fresh and secure.
                    </DialogDescription>
                </DialogHeader>

                <div className="profile-settings-layout">
                    <form onSubmit={handleProfileSubmit} className="profile-settings-card">
                        <div className="profile-settings-heading">
                            <UserRound className="h-5 w-5 text-yellow-500" />
                            <div>
                                <h3 className="profile-settings-title">Personal details</h3>
                                <p className="profile-settings-copy">Update your avatar, name, and phone number.</p>
                            </div>
                        </div>

                        <div className="profile-avatar-editor">
                            <Avatar className="profile-avatar-preview">
                                <AvatarImage src={profileImage || undefined} />
                                <AvatarFallback className="bg-yellow-500 text-xl font-bold text-gray-900">
                                    {name.trim()?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="profile-avatar-actions">
                                <label htmlFor="profilePhoto" className="profile-photo-btn">
                                    <Camera className="h-4 w-4" />
                                    Change photo
                                </label>
                                <input
                                    id="profilePhoto"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                                {profileImage && (
                                    <button
                                        type="button"
                                        className="profile-photo-remove"
                                        onClick={() => setProfileImage("")}
                                    >
                                        <X className="h-4 w-4" />
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        <label className="profile-field">
                            <span className="profile-field-label">Full name</span>
                            <Input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="profile-field-input"
                                placeholder="Your name"
                            />
                        </label>

                        <label className="profile-field">
                            <span className="profile-field-label">Phone number</span>
                            <div className="profile-input-icon-wrap">
                                <Phone className="profile-input-icon" />
                                <Input
                                    value={phoneNumber}
                                    onChange={(event) => setPhoneNumber(event.target.value)}
                                    className="profile-field-input profile-field-input-with-icon"
                                    placeholder="Add your phone number"
                                    type="tel"
                                />
                            </div>
                        </label>

                        <Button type="submit" className="profile-save-btn" disabled={isPending}>
                            <Save className="h-4 w-4" />
                            Save profile
                        </Button>
                    </form>

                    <form onSubmit={handlePasswordSubmit} className="profile-settings-card">
                        <div className="profile-settings-heading">
                            <KeyRound className="h-5 w-5 text-teal-400" />
                            <div>
                                <h3 className="profile-settings-title">Password</h3>
                                <p className="profile-settings-copy">Use your current password to set a new one.</p>
                            </div>
                        </div>

                        <label className="profile-field">
                            <span className="profile-field-label">Current password</span>
                            <Input
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                className="profile-field-input"
                                placeholder="Current password"
                                type="password"
                            />
                        </label>

                        <label className="profile-field">
                            <span className="profile-field-label">New password</span>
                            <Input
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                className="profile-field-input"
                                placeholder="At least 8 characters"
                                type="password"
                            />
                        </label>

                        <label className="profile-field">
                            <span className="profile-field-label">Confirm password</span>
                            <Input
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                className="profile-field-input"
                                placeholder="Confirm new password"
                                type="password"
                            />
                        </label>

                        <Button type="submit" className="profile-password-btn" disabled={isPending}>
                            <KeyRound className="h-4 w-4" />
                            Change password
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileSettingsDialog;
