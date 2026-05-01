import { useEffect, useMemo, useState } from "react";
import { SkeletonLoader } from "../../components/loaders/SkeletonLoader";
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";
import type { NotificationPreferences } from "../../types/notifications";

type PreferenceKey = keyof NotificationPreferences;

interface PreferenceRowConfig {
  key: PreferenceKey;
  label: string;
  group: "Adoption events" | "Escrow events" | "Dispute events" | "Approval events";
  isSdkEvent?: boolean;
}

interface PreferenceChannelState {
  email: boolean;
  inApp: boolean;
}

const ROWS: PreferenceRowConfig[] = [
  { key: "DOCUMENT_EXPIRING", label: "Document expiring", group: "Adoption events" },
  { key: "CUSTODY_EXPIRING", label: "Custody expiring", group: "Adoption events" },
  { key: "ESCROW_FUNDED", label: "Escrow funded", group: "Escrow events", isSdkEvent: true },
  { key: "SETTLEMENT_COMPLETE", label: "Settlement complete", group: "Escrow events", isSdkEvent: true },
  { key: "DISPUTE_RAISED", label: "Dispute raised", group: "Dispute events" },
  { key: "APPROVAL_REQUESTED", label: "Approval requested", group: "Approval events" },
];

function ChannelToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        value ? "bg-orange-500" : "bg-gray-300",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          value ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const { data, isLoading } = useNotificationPreferences();
  const [channels, setChannels] = useState<Record<PreferenceKey, PreferenceChannelState> | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }

    setChannels({
      APPROVAL_REQUESTED: { email: data.APPROVAL_REQUESTED, inApp: data.APPROVAL_REQUESTED },
      ESCROW_FUNDED: { email: data.ESCROW_FUNDED, inApp: data.ESCROW_FUNDED },
      DISPUTE_RAISED: { email: data.DISPUTE_RAISED, inApp: data.DISPUTE_RAISED },
      SETTLEMENT_COMPLETE: { email: data.SETTLEMENT_COMPLETE, inApp: data.SETTLEMENT_COMPLETE },
      DOCUMENT_EXPIRING: { email: data.DOCUMENT_EXPIRING, inApp: data.DOCUMENT_EXPIRING },
      CUSTODY_EXPIRING: { email: data.CUSTODY_EXPIRING, inApp: data.CUSTODY_EXPIRING },
    });
  }, [data]);

  const groupedRows = useMemo(() => {
    return ROWS.reduce<Record<PreferenceRowConfig["group"], PreferenceRowConfig[]>>(
      (acc, row) => {
        acc[row.group].push(row);
        return acc;
      },
      {
        "Adoption events": [],
        "Escrow events": [],
        "Dispute events": [],
        "Approval events": [],
      },
    );
  }, []);

  const updateChannel = (key: PreferenceKey, channel: keyof PreferenceChannelState, next: boolean) => {
    setChannels((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [key]: {
          ...previous[key],
          [channel]: next,
        },
      };
    });
  };

  if (isLoading || !channels) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Notification Settings</h1>
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLoader key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Notification Settings</h1>
      <p className="mb-6 text-sm text-gray-500">Manage which events send email and in-app notifications.</p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">Event type</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">In-app</th>
            </tr>
          </thead>

          {Object.entries(groupedRows).map(([group, rows]) => (
            <tbody key={group}>
              <tr className="border-y border-gray-200 bg-gray-50">
                <th colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group}
                </th>
              </tr>

              {rows.map((row) => (
                <tr key={row.key} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <span>{row.label}</span>
                    {row.isSdkEvent && (
                      <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        SDK event
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ChannelToggle
                      value={channels[row.key].email}
                      onChange={(next) => updateChannel(row.key, "email", next)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ChannelToggle
                      value={channels[row.key].inApp}
                      onChange={(next) => updateChannel(row.key, "inApp", next)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
