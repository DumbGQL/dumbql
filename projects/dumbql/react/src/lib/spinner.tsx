import { type CSSProperties, type ReactNode } from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'accent' | 'warn' | 'inherit';

export interface SpinnerProps {
	readonly size?: SpinnerSize;
	readonly color?: SpinnerColor;
	readonly label?: string;
	readonly showLabel?: boolean;
	readonly style?: CSSProperties;
	readonly className?: string;
}

const sizeMap: Record<SpinnerSize, number> = { xs: 14, sm: 18, md: 28, lg: 40, xl: 56 };

export function Spinner({ size = 'md', color = 'primary', label = 'Loading...', showLabel = false, style, className = '' }: SpinnerProps): ReactNode {
	const px = sizeMap[size];
	return (
		<div
			className={`dumbql-spinner dumbql-spinner--${color} ${className}`.trim()}
			style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...style }}
			role="status"
			aria-label="Loading"
		>
			<svg width={px} height={px} viewBox="0 0 50 50" style={{ animation: 'dumbql-spin 0.8s linear infinite' }}>
				<circle
					className={`dumbql-spinner__circle dumbql-spinner__circle--${color}`}
					cx="25" cy="25" r="20"
					fill="none" stroke="currentColor" strokeWidth="4"
					strokeLinecap="round"
					style={{ strokeDasharray: '90, 150', strokeDashoffset: 0, animation: 'dumbql-dash 1.4s ease-in-out infinite' }}
				/>
			</svg>
			{showLabel && <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>}
			<style>{`
				@keyframes dumbql-spin { 100% { transform: rotate(360deg); } }
				@keyframes dumbql-dash {
					0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
					50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
					100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
				}
				.dumbql-spinner__circle--primary { stroke: var(--dumbql-primary, #3b82f6); }
				.dumbql-spinner__circle--accent { stroke: var(--dumbql-accent, #8b5cf6); }
				.dumbql-spinner__circle--warn { stroke: var(--dumbql-warn, #ef4444); }
				.dumbql-spinner__circle--inherit { stroke: currentColor; }
			`}</style>
		</div>
	);
}
