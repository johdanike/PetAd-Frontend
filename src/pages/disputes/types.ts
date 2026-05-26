export interface EvidenceFile {
  id: string;
  fileName: string;
  url: string;
  sha256: string;
}

export type ResolutionType = "REFUND" | "RELEASE" | "SPLIT";

export interface ResolutionDistributionItem {
  recipient: string;
  amount: string;
  percentage: number;
}

export interface DisputeResolution {
  type: ResolutionType;
  adminNote: string;
  resolvedBy: string;
  resolvedAt: string;
  resolutionTxHash?: string;
  splitDistribution?: ResolutionDistributionItem[];
}

export interface DisputeDetail {
  id: string;
  raisedBy: {
    name: string;
    role: "ADOPTER" | "SHELTER" | "ADMIN";
  };
  reason: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  slaStatus: "ON_TIME" | "AT_RISK" | "BREACHED";
  escrow: {
    status: "LOCKED" | "RELEASED" | "REFUNDED";
    accountId: string;
  };
  evidence: EvidenceFile[];
  resolution?: DisputeResolution | null;
}
