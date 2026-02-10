"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Package } from "lucide-react";

interface Delivery {
  id: string;
  description: string;
  link?: string | null;
  fileUrl?: string | null;
  report?: string | null;
  createdAt: string;
}

interface DeliverySectionProps {
  deliveries: Delivery[];
}

export function DeliverySection({ deliveries }: DeliverySectionProps) {
  if (deliveries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Deliveries ({deliveries.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliveries.map((delivery, idx) => (
          <div key={delivery.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Delivery #{deliveries.length - idx}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(delivery.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm">{delivery.description}</p>
            <div className="flex flex-wrap gap-2">
              {delivery.link && (
                <a
                  href={delivery.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Link
                </a>
              )}
              {delivery.fileUrl && (
                <a
                  href={delivery.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Package className="h-3.5 w-3.5" />
                  Download File
                </a>
              )}
            </div>
            {delivery.report && (
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Project Report
                </p>
                <p className="text-sm whitespace-pre-wrap">{delivery.report}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
