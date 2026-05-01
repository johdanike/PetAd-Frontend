import { useMemo } from "react";
import { apiClient } from "../lib/api-client";
import { useApiQuery } from "./useApiQuery";
import type { DisputeDetail } from "../pages/disputes/types";

interface DisputeDetailApiResponse extends DisputeDetail {
  resolution?: {
    txHash?: string;
  } | null;
}

export interface EnrichedDisputeDetail extends DisputeDetail {
  escrowOnChainStatus: string;
  stellarExplorerUrl: string;
  resolutionTxHash?: string;
}

function buildStellarExplorerUrl(accountId: string): string {
  return `https://stellar.expert/explorer/public/account/${encodeURIComponent(accountId)}`;
}

export function useDisputeDetail(disputeId: string) {
  const query = useApiQuery<DisputeDetailApiResponse>(
    ["dispute-detail", disputeId],
    () => apiClient.get<DisputeDetailApiResponse>(`/disputes/${disputeId}`),
    { enabled: Boolean(disputeId) },
  );

  const enrichedData = useMemo<EnrichedDisputeDetail | undefined>(() => {
    if (!query.data) {
      return undefined;
    }

    return {
      ...query.data,
      escrowOnChainStatus: query.data.escrow.status,
      stellarExplorerUrl: buildStellarExplorerUrl(query.data.escrow.accountId),
      resolutionTxHash: query.data.resolution?.txHash,
    };
  }, [query.data]);

  return {
    ...query,
    data: enrichedData,
  };
}
