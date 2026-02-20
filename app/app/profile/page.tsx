"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { updateProfile } from "firebase/auth";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "@/hooks";
import { UserService, type UserData } from "@/services/user.service";
import { auth, db, storage } from "@/lib/firebase.config";
import { useAuthStore } from "@/stores";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fallbackTimezones = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Warsaw",
  "Europe/Athens",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const fallbackCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "MXN",
  "BRL",
  "ARS",
  "CLP",
  "COP",
  "PEN",
  "UYU",
  "ZAR",
  "NGN",
  "EGP",
  "JPY",
  "KRW",
  "CNY",
  "HKD",
  "SGD",
  "INR",
  "THB",
  "IDR",
  "PHP",
  "MYR",
  "AED",
  "AUD",
  "NZD",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "HUF",
  "TRY",
  "RUB",
];

const fallbackLocales = [
  "en-US",
  "en-GB",
  "es-ES",
  "es-MX",
  "pt-BR",
  "fr-FR",
  "de-DE",
  "it-IT",
  "nl-NL",
  "pl-PL",
  "sv-SE",
  "da-DK",
  "nb-NO",
  "fi-FI",
  "tr-TR",
  "ru-RU",
  "ar-AE",
  "ja-JP",
  "ko-KR",
  "zh-CN",
  "zh-TW",
  "hi-IN",
  "th-TH",
  "id-ID",
  "vi-VN",
];

type ProfileFormState = {
  displayName: string;
  email: string;
  photoURL: string;
  photoStoragePath: string;
  timezone: string;
  currency: string;
  locale: string;
  timeFormat: "12h" | "24h";
  weekStartsOn: "monday" | "sunday";
};

const getDefaultLocale = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
  } catch (error) {
    return "en-US";
  }
};

const getDefaultTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (error) {
    return "UTC";
  }
};

const getDefaultTimeFormat = (locale: string): "12h" | "24h" => {
  try {
    const hourCycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
    return hourCycle && (hourCycle === "h23" || hourCycle === "h24") ? "24h" : "12h";
  } catch (error) {
    return "24h";
  }
};

const formatCurrencyLabel = (currency: string, locale: string) => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    });
    return `${currency} (${formatter.format(0)})`;
  } catch (error) {
    return currency;
  }
};

const ProfilePage = () => {
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [profile, setProfile] = useState<ProfileFormState>(() => {
    const locale = getDefaultLocale();
    return {
      displayName: "",
      email: "",
      photoURL: "",
      photoStoragePath: "",
      timezone: getDefaultTimeZone(),
      currency: "USD",
      locale,
      timeFormat: getDefaultTimeFormat(locale),
      weekStartsOn: "monday",
    };
  });

  const timezones = useMemo(() => {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      try {
        return Intl.supportedValuesOf("timeZone");
      } catch (error) {
        return fallbackTimezones;
      }
    }
    return fallbackTimezones;
  }, []);

  const currencies = useMemo(() => {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      try {
        return Intl.supportedValuesOf("currency");
      } catch (error) {
        return fallbackCurrencies;
      }
    }
    return fallbackCurrencies;
  }, []);

  const locales = useMemo(() => {
    if (typeof navigator !== "undefined" && Array.isArray(navigator.languages)) {
      return Array.from(new Set([...navigator.languages, ...fallbackLocales]));
    }
    return fallbackLocales;
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const userService = UserService.getInstance(db);
        const data = await userService.getUser(user.uid);
        const locale = data?.locale || getDefaultLocale();
        const nextProfile: ProfileFormState = {
          displayName: data?.displayName || user.displayName || "",
          email: data?.email || user.email || "",
          photoURL: data?.photoURL || user.photoURL || "",
          photoStoragePath: data?.photoStoragePath || "",
          timezone: data?.timezone || getDefaultTimeZone(),
          currency: data?.currency || "USD",
          locale,
          timeFormat: data?.timeFormat || getDefaultTimeFormat(locale),
          weekStartsOn: data?.weekStartsOn || "monday",
        };

        setProfile(nextProfile);
        setPhotoPreview(nextProfile.photoURL);
      } catch (loadError: any) {
        setError(loadError?.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const initials = useMemo(() => {
    const base = profile.displayName || profile.email || "User";
    const parts = base.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [profile.displayName, profile.email]);

  const handleFieldChange = (field: keyof ProfileFormState, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSuccess(null);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setPhotoPreviewUrl(preview);
    setPhotoFile(file);
    setRemovePhoto(false);
    setSuccess(null);
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
    setPhotoPreview("");
    setPhotoFile(null);
    setRemovePhoto(true);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let photoURL = profile.photoURL;
      let photoStoragePath = profile.photoStoragePath;

      if (photoFile) {
        const storagePath = `users/${user.uid}/profile.jpg`;
        const photoRef = ref(storage, storagePath);
        await uploadBytes(photoRef, photoFile, { contentType: photoFile.type });
        photoURL = await getDownloadURL(photoRef);
        photoStoragePath = storagePath;
      }

      if (removePhoto) {
        const storagePath = profile.photoStoragePath || `users/${user.uid}/profile.jpg`;
        try {
          await deleteObject(ref(storage, storagePath));
        } catch (removeError) {
          // Ignore missing storage objects.
        }
        photoURL = "";
        photoStoragePath = "";
      }

      const userService = UserService.getInstance(db);
      const updates: Partial<UserData> = {
        displayName: profile.displayName,
        photoURL,
        photoStoragePath,
        timezone: profile.timezone,
        currency: profile.currency,
        locale: profile.locale,
        timeFormat: profile.timeFormat,
        weekStartsOn: profile.weekStartsOn,
      };

      await userService.updateUser(user.uid, updates);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: profile.displayName,
          photoURL: photoURL || null,
        });
        await auth.currentUser.reload();
        setUser(auth.currentUser);
      }

      setProfile((prev) => ({
        ...prev,
        photoURL,
        photoStoragePath,
      }));
      setPhotoPreview(photoURL);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
        setPhotoPreviewUrl(null);
      }
      setPhotoFile(null);
      setRemovePhoto(false);
      setSuccess("Profile updated successfully.");
    } catch (saveError: any) {
      setError(saveError?.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Update your personal details, photo, and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your public identity and avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-3 md:items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoPreview || undefined} alt="Profile" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handlePhotoClick}>
                  Upload
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemovePhoto}
                  disabled={!photoPreview && !profile.photoURL}
                >
                  Remove
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="flex-1 grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Full name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(event) => handleFieldChange("displayName", event.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Personalize how time and money are displayed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label>Timezone</Label>
              <Select
                value={profile.timezone}
                onValueChange={(value) => handleFieldChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select
                value={profile.currency}
                onValueChange={(value) => handleFieldChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {currencies.map((code) => (
                    <SelectItem key={code} value={code}>
                      {formatCurrencyLabel(code, profile.locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Locale</Label>
              <Select
                value={profile.locale}
                onValueChange={(value) => handleFieldChange("locale", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {locales.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Time format</Label>
              <Select
                value={profile.timeFormat}
                onValueChange={(value) => handleFieldChange("timeFormat", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Week starts on</Label>
              <Select
                value={profile.weekStartsOn}
                onValueChange={(value) => handleFieldChange("weekStartsOn", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select start day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {loading && <span className="text-sm text-muted-foreground">Loading profile...</span>}
          {error && <span className="text-sm text-destructive">{error}</span>}
          {success && <span className="text-sm text-emerald-600">{success}</span>}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfilePage;
