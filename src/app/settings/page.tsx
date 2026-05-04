"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [scrapeMonths, setScrapeMonths] = useState("3");
  const [scrapeMonthsSaved, setScrapeMonthsSaved] = useState(false);
  const [scrapeGroupConcurrency, setScrapeGroupConcurrency] = useState("4");
  const [scrapeGroupConcurrencySaved, setScrapeGroupConcurrencySaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((config) => {
        if (config.scrape_months_back) {
          setScrapeMonths(config.scrape_months_back);
        }

        if (config.scrape_group_concurrency) {
          setScrapeGroupConcurrency(config.scrape_group_concurrency);
        }
      });
  }, []);

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters");
      return;
    }

    const unlockRes = await fetch("/api/auth/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlock", password: currentPassword }),
    });

    if (!unlockRes.ok) {
      setPasswordMessage("Current password is incorrect");
      return;
    }

    const createRes = await fetch("/api/auth/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", password: newPassword }),
    });

    if (createRes.ok) {
      setPasswordMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMessage("Failed to change password");
    }
  }

  async function handleSaveScrapeMonths(value: string) {
    setScrapeMonths(value);
    setScrapeMonthsSaved(false);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "scrape_months_back", value }),
    });
    setScrapeMonthsSaved(true);
    setTimeout(() => setScrapeMonthsSaved(false), 2000);
  }

  async function handleSaveScrapeGroupConcurrency(value: string) {
    setScrapeGroupConcurrency(value);
    setScrapeGroupConcurrencySaved(false);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "scrape_group_concurrency", value }),
    });
    setScrapeGroupConcurrencySaved(true);
    setTimeout(() => setScrapeGroupConcurrencySaved(false), 2000);
  }

  async function handleRecategorize() {
    const response = await fetch("/api/category-rules", { method: "POST" });
    if (response.ok) {
      alert("Re-categorization complete");
    }
  }

  return (
    <div className="app-page-shell max-w-3xl">
      <div className="space-y-2">
        <p className="app-eyebrow-label">Configuration</p>
        <div className="space-y-2">
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure scraping scope, update the master password, and run maintenance actions.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scraping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Transaction History Range</Label>
            <Select value={scrapeMonths} onValueChange={handleSaveScrapeMonths}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 month</SelectItem>
                <SelectItem value="2">2 months</SelectItem>
                <SelectItem value="3">3 months (default)</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How far back to fetch transactions when scraping. Longer ranges take more time.
              {scrapeMonthsSaved && (
                <span className="ml-2 text-positive">Saved!</span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Parallel Credential Groups</Label>
            <Select
              value={scrapeGroupConcurrency}
              onValueChange={handleSaveScrapeGroupConcurrency}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 group</SelectItem>
                <SelectItem value="2">2 groups</SelectItem>
                <SelectItem value="3">3 groups</SelectItem>
                <SelectItem value="4">4 groups (default)</SelectItem>
                <SelectItem value="5">5 groups</SelectItem>
                <SelectItem value="6">6 groups</SelectItem>
                <SelectItem value="8">8 groups</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How many independent shared-login groups can scrape at the same time.
              Higher values reduce total sync time but increase browser and bank load.
              {scrapeGroupConcurrencySaved && (
                <span className="ml-2 text-positive">Saved!</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Change Master Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {passwordMessage && (
            <p className="text-sm text-muted-foreground">{passwordMessage}</p>
          )}
          <Button onClick={handleChangePassword}>Change Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Re-run auto-categorization rules on all uncategorized transactions.
            </p>
            <Button variant="outline" onClick={handleRecategorize}>
              Re-categorize Transactions
            </Button>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Database location: <span className="font-medium text-foreground">prisma/dev.db</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Encrypted credentials: <span className="font-medium text-foreground">config/credentials.enc</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
