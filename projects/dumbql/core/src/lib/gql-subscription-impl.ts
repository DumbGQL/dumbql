/**
 * Minimal GraphQL WebSocket subscription client.
 * Used by subscribeTo() when the @dumbql/subscriptions package is not installed.
 */
export class GqlSubscriptionWsClient {
	private ws: WebSocket | null = null;

	constructor(private readonly url: string) {}

	subscribe<T>(
		query: string,
		variables?: Record<string, unknown>,
		observers: {
			readonly next: (data: T) => void;
			readonly error: (err: unknown) => void;
			readonly complete: () => void;
		},
	): () => void {
		this.ws = new WebSocket(this.url);

		this.ws.onopen = () => {
			this.ws?.send(JSON.stringify({ type: 'connection_init', payload: {} }));
			this.ws?.send(JSON.stringify({
				id: '1',
				type: 'subscribe',
				payload: { query, variables },
			}));
		};

		this.ws.onmessage = (event: MessageEvent) => {
			try {
				const msg = JSON.parse(event.data as string) as {
					type: string;
					payload?: { data?: T };
				};
				if (msg.type === 'data' && msg.payload?.data) {
					observers.next(msg.payload.data);
				}
			} catch {
				// ignore parse errors
			}
		};

		this.ws.onerror = (err: Event) => observers.error(err);
		this.ws.onclose = () => observers.complete();

		return () => this.ws?.close();
	}
}
