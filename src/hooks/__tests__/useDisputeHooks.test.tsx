import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import toast from "react-hot-toast";

// Note: Depending on the exact paths in the repository, you may need to adjust these imports.
import { useMutateRaiseDispute } from "../useMutateRaiseDispute";
import { useMutateResolveDispute } from "../useMutateResolveDispute";
import { useMyDisputes } from "../useMyDisputes";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("Dispute Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMutateRaiseDispute", () => {
    it("calls POST /disputes and triggers success toast", async () => {
      const { wrapper } = createWrapper();
      
      let requestedUrl = "";
      let requestedMethod = "";
      server.use(
        http.post("*/disputes", ({ request }) => {
          requestedUrl = request.url;
          requestedMethod = request.method;
          return HttpResponse.json({ adoptionId: "adoption-123" });
        })
      );

      const { result } = renderHook(() => useMutateRaiseDispute(), { wrapper });

      act(() => {
        result.current.mutate({
          adoptionId: "adoption-123",
          raisedBy: "user-buyer-1",
          reason: "delayed_handover",
          description: "Not handed over",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(toast.success).toHaveBeenCalled();
      expect(result.current.data?.adoptionId).toBe("adoption-123");
      expect(requestedMethod).toBe("POST");
      expect(requestedUrl).toMatch(/\/disputes$/);
    });
  });

  describe("useMutateResolveDispute", () => {
    it("calls PATCH endpoint and invalidates queries on success", async () => {
      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      
      let requestedUrl = "";
      let requestedMethod = "";
      server.use(
        http.patch("*/disputes/:id", ({ request }) => {
          requestedUrl = request.url;
          requestedMethod = request.method;
          return HttpResponse.json({ status: "RESOLVED", resolution: "Refund issued" });
        })
      );

      const { result } = renderHook(() => useMutateResolveDispute(), { wrapper });

      act(() => {
        result.current.mutate({
          id: "dispute-001",
          resolution: "Refund issued",
          resolvedBy: "admin-1",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.status).toBe("RESOLVED");
      expect(result.current.data?.resolution).toBe("Refund issued");
      
      // Verify invalidateQueries was called
      expect(invalidateSpy).toHaveBeenCalled();
      expect(requestedMethod).toBe("PATCH");
      expect(requestedUrl).toMatch(/\/disputes\/dispute-001$/);
    });
  });

  describe("useMyDisputes", () => {
    it("returns scoped data for disputes list", async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMyDisputes(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data?.data)).toBe(true);
    });
  });
});