import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DisputeResolutionSection } from "../DisputeResolutionSection";
import type { DisputeDetail } from "../../../pages/disputes/types";

// Mock stellar lib so tests don't depend on env vars
vi.mock("../../../lib/stellar", () => ({
  stellarExplorerUrl: (txHash: string) => {
    if (!txHash) throw new Error("Transaction hash is required");
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  },
  truncateTxHash: (txHash: string) => {
    if (!txHash) return "";
    if (txHash.length <= 16) return txHash;
    return `${txHash.slice(0, 8)}...${txHash.slice(-8)}`;
  },
}));

const baseDispute: DisputeDetail = {
  id: "DSP-001",
  raisedBy: { name: "Alice", role: "ADOPTER" },
  reason: "Pet not as described",
  status: "OPEN",
  slaStatus: "ON_TIME",
  escrow: { status: "LOCKED", accountId: "GBTEST123" },
  evidence: [],
  resolution: null,
};

const resolvedDispute: DisputeDetail = {
  ...baseDispute,
  status: "RESOLVED",
  resolution: {
    type: "REFUND",
    adminNote: "Adopter's claim was valid. Full refund issued.",
    resolvedBy: "Admin Bob",
    resolvedAt: "2026-04-01T12:00:00Z",
    resolutionTxHash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  },
};

describe("DisputeResolutionSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when status is OPEN", () => {
    const { container } = render(
      <DisputeResolutionSection dispute={baseDispute} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when status is UNDER_REVIEW", () => {
    const { container } = render(
      <DisputeResolutionSection
        dispute={{ ...baseDispute, status: "UNDER_REVIEW" }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when status is RESOLVED but resolution is null", () => {
    const { container } = render(
      <DisputeResolutionSection
        dispute={{ ...baseDispute, status: "RESOLVED", resolution: null }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the resolution section when status is RESOLVED", () => {
    render(<DisputeResolutionSection dispute={resolvedDispute} />);
    expect(screen.getByTestId("dispute-resolution-section")).toBeInTheDocument();
  });

  it("shows the resolution type badge for REFUND", () => {
    render(<DisputeResolutionSection dispute={resolvedDispute} />);
    expect(screen.getByTestId("resolution-type-badge")).toBeInTheDocument();
    expect(screen.getByText("Refund")).toBeInTheDocument();
  });

  it("shows the resolution type badge for RELEASE", () => {
    render(
      <DisputeResolutionSection
        dispute={{
          ...resolvedDispute,
          resolution: { ...resolvedDispute.resolution!, type: "RELEASE" },
        }}
      />
    );
    expect(screen.getByText("Release")).toBeInTheDocument();
  });

  it("shows the resolution type badge for SPLIT", () => {
    render(
      <DisputeResolutionSection
        dispute={{
          ...resolvedDispute,
          resolution: {
            ...resolvedDispute.resolution!,
            type: "SPLIT",
            splitDistribution: [
              { recipient: "Shelter", amount: "60.00", percentage: 60 },
              { recipient: "Adopter", amount: "40.00", percentage: 40 },
            ],
          },
        }}
      />
    );
    expect(screen.getByText("Split")).toBeInTheDocument();
  });

  it("shows admin note", () => {
    render(<DisputeResolutionSection dispute={resolvedDispute} />);
    expect(screen.getByTestId("resolution-admin-note")).toHaveTextContent(
      "Adopter's claim was valid. Full refund issued."
    );
  });

  it("shows resolved by", () => {
    render(<DisputeResolutionSection dispute={resolvedDispute} />);
    expect(screen.getByTestId("resolution-resolved-by")).toHaveTextContent(
      "Admin Bob"
    );
  });

  it("shows resolved at date", () => {
    render(<DisputeResolutionSection dispute={resolvedDispute} />);
    expect(screen.getByTestId("resolution-resolved-at")).toBeInTheDocument();
  });

  it("renders StellarTxLink when resolutionTxHash is present", () => {
    render(<DisputeResolutionSection dispute={resolvedDispute} />);
    expect(screen.getByTestId("stellar-tx-link")).toBeInTheDocument();
  });

  it("does not render StellarTxLink when resolutionTxHash is absent", () => {
    render(
      <DisputeResolutionSection
        dispute={{
          ...resolvedDispute,
          resolution: {
            ...resolvedDispute.resolution!,
            resolutionTxHash: undefined,
          },
        }}
      />
    );
    expect(screen.queryByTestId("stellar-tx-link")).not.toBeInTheDocument();
  });

  it("renders SplitOutcomeChart when type is SPLIT with distribution data", () => {
    render(
      <DisputeResolutionSection
        dispute={{
          ...resolvedDispute,
          resolution: {
            type: "SPLIT",
            adminNote: "Split decision.",
            resolvedBy: "Admin",
            resolvedAt: "2026-04-01T12:00:00Z",
            splitDistribution: [
              { recipient: "Shelter", amount: "60.00", percentage: 60 },
              { recipient: "Adopter", amount: "40.00", percentage: 40 },
            ],
          },
        }}
      />
    );
    expect(screen.getByTestId("resolution-split-chart")).toBeInTheDocument();
    expect(screen.getByTestId("split-outcome-chart")).toBeInTheDocument();
  });

  it("does not render SplitOutcomeChart when type is REFUND", () => {
    render(<DisputeResolutionSection dispute={resolvedDispute} />);
    expect(screen.queryByTestId("resolution-split-chart")).not.toBeInTheDocument();
  });

  it("does not render SplitOutcomeChart when type is SPLIT but distribution is empty", () => {
    render(
      <DisputeResolutionSection
        dispute={{
          ...resolvedDispute,
          resolution: {
            type: "SPLIT",
            adminNote: "Split.",
            resolvedBy: "Admin",
            resolvedAt: "2026-04-01T12:00:00Z",
            splitDistribution: [],
          },
        }}
      />
    );
    expect(screen.queryByTestId("resolution-split-chart")).not.toBeInTheDocument();
  });
});
