import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDisputeDetail } from "../useDisputeDetail";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useDisputeDetail", () => {
  it("returns enriched detail shape", async () => {
    const { result } = renderHook(() => useDisputeDetail("dispute-resolved"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.data).toMatchObject({
      id: "dispute-resolved",
      status: "RESOLVED",
      escrowOnChainStatus: "RELEASED",
      stellarExplorerUrl: "https://stellar.expert/explorer/public/account/GDRS77ACCOUNT12345",
      resolutionTxHash: "txhash-resolved-123456",
    });
  });

  it("returns enriched shape for open dispute without resolution tx hash", async () => {
    const { result } = renderHook(() => useDisputeDetail("dispute-open"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toMatchObject({
      id: "dispute-open",
      status: "OPEN",
      escrowOnChainStatus: "LOCKED",
      stellarExplorerUrl: "https://stellar.expert/explorer/public/account/GABC88ACCOUNT67890",
    });
    expect(result.current.data?.resolutionTxHash).toBeUndefined();
  });

  it("returns isNotFound for 404", async () => {
    const { result } = renderHook(() => useDisputeDetail("not-found"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.isNotFound).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
