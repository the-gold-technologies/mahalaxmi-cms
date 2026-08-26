"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/PageHeader";
import { InputField } from "@/components/InputField";
import { SaveButton } from "@/components/SaveButton";

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "Mahalaxmi Admin");
      setEmail(session.user.email || "admin@mahalaxmi.com");
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          currentPassword,
          newPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success("Profile updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        update({ name });
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Admin Profile &amp; Account Settings"
        description="Update your administrator credentials, email address, and dashboard security password."
        badge="Settings"
      />

      <form
        onSubmit={handleSave}
        className="border border-slate-200 rounded-2xl bg-white p-6 shadow-xs flex flex-col gap-6 max-w-2xl"
      >
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          1. Administrator Information
        </h3>
        <InputField
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <InputField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 pt-2">
          2. Change Password
        </h3>
        <InputField
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Leave blank to keep unchanged"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <InputField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
          />
        </div>

        <div className="flex justify-end pt-2">
          <SaveButton
            loading={loading}
            saved={saved}
            type="submit"
            label="Update Profile"
          />
        </div>
      </form>
    </section>
  );
}
