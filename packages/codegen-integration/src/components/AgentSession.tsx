/**
 * AgentSession React Component
 * Displays and manages a Codegen agent session with TypeScript
 */

import type { CSSProperties, FC } from "react";
import { useEffect, useState } from "react";
import React from "react";
import type { CodegenClient } from "../api/codegen-client.js";
import type { AgentStatus, SessionInfo } from "../types/codegen.js";

/**
 * Component Props
 */
export interface AgentSessionProps {
	readonly sessionId: string;
	readonly client: CodegenClient;
	readonly onStatusChange?: (status: AgentStatus) => void;
	readonly refreshInterval?: number;
}

/**
 * Status indicator styles
 */
const statusStyles: Record<AgentStatus, CSSProperties> = {
	idle: { color: "#6B7280", backgroundColor: "#F3F4F6" },
	running: { color: "#2563EB", backgroundColor: "#DBEAFE" },
	completed: { color: "#059669", backgroundColor: "#D1FAE5" },
	failed: { color: "#DC2626", backgroundColor: "#FEE2E2" },
	cancelled: { color: "#7C2D12", backgroundColor: "#FED7AA" },
};

/**
 * AgentSession Component
 */
export const AgentSession: FC<AgentSessionProps> = ({
	sessionId,
	client,
	onStatusChange,
	refreshInterval = 5000,
}) => {
	const [session, setSession] = useState<SessionInfo | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null;

		const fetchSession = async () => {
			try {
				const response = await client.getSession(sessionId);
				if (response.success && response.data) {
					setSession(response.data);
					setError(null);

					// Notify parent of status change
					if (onStatusChange) {
						onStatusChange(response.data.status);
					}
				} else if (response.error) {
					setError(response.error.message);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error occurred");
			} finally {
				setLoading(false);
			}
		};

		// Initial fetch
		void fetchSession();

		// Set up polling for active sessions
		if (session?.status === "running" || session?.status === "idle") {
			intervalId = setInterval(() => {
				void fetchSession();
			}, refreshInterval);
		}

		// Cleanup interval on unmount
		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [sessionId, client, session?.status, onStatusChange, refreshInterval]);

	if (loading) {
		return <LoadingSpinner />;
	}

	if (error) {
		return <ErrorDisplay message={error} />;
	}

	if (!session) {
		return <div>No session data available</div>;
	}

	return (
		<div style={containerStyle}>
			<div style={headerStyle}>
				<h2 style={titleStyle}>Agent Session</h2>
				<StatusBadge status={session.status} />
			</div>

			<div style={contentStyle}>
				<InfoRow label="Session ID" value={session.sessionId} />
				<InfoRow label="Created" value={session.createdAt.toLocaleString()} />
				<InfoRow label="Updated" value={session.updatedAt.toLocaleString()} />

				{session.metadata.duration && (
					<InfoRow
						label="Duration"
						value={`${(session.metadata.duration / 1000).toFixed(2)}s`}
					/>
				)}

				{session.metadata.tokensUsed && (
					<InfoRow
						label="Tokens Used"
						value={session.metadata.tokensUsed.toString()}
					/>
				)}

				{session.metadata.filesModified &&
					session.metadata.filesModified.length > 0 && (
						<div style={sectionStyle}>
							<h3 style={sectionTitleStyle}>Modified Files</h3>
							<ul style={listStyle}>
								{session.metadata.filesModified.map((file) => (
									<li key={file} style={listItemStyle}>
										{file}
									</li>
								))}
							</ul>
						</div>
					)}

				{session.metadata.toolsUsed &&
					session.metadata.toolsUsed.length > 0 && (
						<div style={sectionStyle}>
							<h3 style={sectionTitleStyle}>Tools Used</h3>
							<div style={tagsContainerStyle}>
								{session.metadata.toolsUsed.map((tool) => (
									<span key={tool} style={tagStyle}>
										{tool}
									</span>
								))}
							</div>
						</div>
					)}
			</div>
		</div>
	);
};

/**
 * Status Badge Component
 */
interface StatusBadgeProps {
	readonly status: AgentStatus;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
	const style = statusStyles[status];
	return (
		<span style={{ ...badgeStyle, ...style }}>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</span>
	);
};

/**
 * Info Row Component
 */
interface InfoRowProps {
	readonly label: string;
	readonly value: string;
}

const InfoRow: FC<InfoRowProps> = ({ label, value }) => (
	<div style={infoRowStyle}>
		<span style={labelStyle}>{label}:</span>
		<span style={valueStyle}>{value}</span>
	</div>
);

/**
 * Loading Spinner Component
 */
const LoadingSpinner: FC = () => (
	<div style={spinnerContainerStyle}>
		<div style={spinnerStyle}>Loading...</div>
	</div>
);

/**
 * Error Display Component
 */
interface ErrorDisplayProps {
	readonly message: string;
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({ message }) => (
	<div style={errorContainerStyle}>
		<span style={errorIconStyle}>⚠️</span>
		<span style={errorMessageStyle}>{message}</span>
	</div>
);

// Styles
const containerStyle: CSSProperties = {
	border: "1px solid #E5E7EB",
	borderRadius: "8px",
	padding: "24px",
	backgroundColor: "#FFFFFF",
	boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
};

const headerStyle: CSSProperties = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	marginBottom: "16px",
};

const titleStyle: CSSProperties = {
	fontSize: "20px",
	fontWeight: "600",
	margin: "0",
};

const contentStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: "12px",
};

const badgeStyle: CSSProperties = {
	padding: "4px 12px",
	borderRadius: "16px",
	fontSize: "14px",
	fontWeight: "500",
};

const infoRowStyle: CSSProperties = {
	display: "flex",
	gap: "8px",
};

const labelStyle: CSSProperties = {
	fontWeight: "600",
	color: "#374151",
};

const valueStyle: CSSProperties = {
	color: "#6B7280",
};

const sectionStyle: CSSProperties = {
	marginTop: "16px",
};

const sectionTitleStyle: CSSProperties = {
	fontSize: "16px",
	fontWeight: "600",
	marginBottom: "8px",
};

const listStyle: CSSProperties = {
	listStyle: "none",
	padding: "0",
	margin: "0",
};

const listItemStyle: CSSProperties = {
	padding: "4px 0",
	color: "#6B7280",
};

const tagsContainerStyle: CSSProperties = {
	display: "flex",
	flexWrap: "wrap",
	gap: "8px",
};

const tagStyle: CSSProperties = {
	padding: "4px 8px",
	backgroundColor: "#F3F4F6",
	borderRadius: "4px",
	fontSize: "12px",
	color: "#374151",
};

const spinnerContainerStyle: CSSProperties = {
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	padding: "40px",
};

const spinnerStyle: CSSProperties = {
	fontSize: "16px",
	color: "#6B7280",
};

const errorContainerStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: "8px",
	padding: "16px",
	backgroundColor: "#FEE2E2",
	borderRadius: "8px",
	border: "1px solid #FCA5A5",
};

const errorIconStyle: CSSProperties = {
	fontSize: "20px",
};

const errorMessageStyle: CSSProperties = {
	color: "#991B1B",
	fontSize: "14px",
};
