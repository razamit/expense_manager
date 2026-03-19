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

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((config) => {
        if (config.scrape_months_back) {
          setScrapeMonths(config.scrape_months_back);
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

  async function handleRecategorize() {
    const response = await fetch("/api/category-rules", { method: "POST" });
    if (response.ok) {
      alert("Re-categorization complete");
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

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
                <span className="text-green-600 ml-2">Saved!</span>
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
              Database location: <code>prisma/dev.db</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Encrypted credentials: <code>config/credentials.enc</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
