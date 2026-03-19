"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnomalyAlert } from "@/types";

interface AnomalyAlertsListProps {
  anomalies: AnomalyAlert[];
}

export function AnomalyAlertsList({ anomalies }: AnomalyAlertsListProps) {
  if (anomalies.length === 0) return null;

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Anomalies Detected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {anomalies.slice(0, 5).map((anomaly, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 text-sm"
            >
              <div
                className={`mt-0.5 rounded-full p-1 ${
                  anomaly.severity === "alert"
                    ? "bg-red-100 text-red-600"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                <TrendingUp className="h-3 w-3" />
              </div>
              <div>
                <p className="font-medium">{anomaly.title}</p>
                <p className="text-muted-foreground">{anomaly.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
