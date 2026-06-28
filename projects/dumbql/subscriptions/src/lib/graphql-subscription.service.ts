import { Injectable, inject } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { print, type DocumentNode, type DumbqlConfig, DUMBQL_CONFIG } from '@dumbql/core';

interface WsMessage {
  type: string;
  id?: string;
  payload?: unknown;
}

const WS_PROTOCOL = 'graphql-transport-ws';

function sendSubscriptionToExtension(payload: Record<string, unknown>): void {
	if (typeof window === 'undefined') return;
	window.postMessage(
		{
			source: 'dumb-keystore-graphql-debug',
			type: 'graphql-subscription',
			payload,
		},
		'*',
	);
}

@Injectable({ providedIn: 'root' })
export class GraphqlSubscriptionService {
  private readonly config: DumbqlConfig =
    inject(DUMBQL_CONFIG, { optional: true }) ?? { endpoint: '/graphql' } as DumbqlConfig;

  private wsUrl(): string {
  	const base = this.config.endpoint;
  	return base.replace(/^http/, 'ws');
  }

  subscribe<T>(
  	document: DocumentNode,
  	variables?: Record<string, unknown>,
  ): Observable<T> {
  	const query = print(document);

  	return new Observable<T>((subscriber: Subscriber<T>) => {
  		const url = this.wsUrl();
  		let ws: WebSocket;
  		let completed = false;
  		const subId =
  			typeof crypto !== 'undefined' && crypto.randomUUID
  				? crypto.randomUUID()
  				: 'sub_' + Math.random().toString(36).substring(2, 9);

  		sendSubscriptionToExtension({
  			subId,
  			type: 'open',
  			url,
  			timestamp: Date.now(),
  		});

  		try {
  			ws = new WebSocket(url, WS_PROTOCOL);
  		} catch (err) {
  			sendSubscriptionToExtension({ subId, type: 'error', timestamp: Date.now() });
  			subscriber.error(err);
  			return;
  		}

  		const connTimeout = setTimeout(() => {
  			if (!completed) {
  				ws.close();
  				sendSubscriptionToExtension({ subId, type: 'error', timestamp: Date.now() });
  				subscriber.error(new Error('WebSocket connection timeout'));
  			}
  		}, 10000);

  		ws.onopen = () => {
  			ws.send(JSON.stringify({ type: 'connection_init' }));
  		};

  		ws.onmessage = (event: MessageEvent) => {
  			let msg: WsMessage;
  			try {
  				msg = JSON.parse(event.data) as WsMessage;
  			} catch {
  				return;
  			}

  			switch (msg.type) {
  			case 'connection_ack': {
  				clearTimeout(connTimeout);
  				ws.send(JSON.stringify({
  					type: 'subscribe',
  					id: '1',
  					payload: { query, variables },
  				}));
  				break;
  			}
  			case 'next': {
  				const payload = msg.payload as { data?: T; errors?: { message: string }[] };
  				if (payload.errors && payload.errors.length > 0) {
  					sendSubscriptionToExtension({ subId, type: 'error', timestamp: Date.now() });
  					subscriber.error(new Error(payload.errors[0].message));
  				} else if (payload.data !== undefined) {
  					sendSubscriptionToExtension({ subId, type: 'next', payload: payload.data, timestamp: Date.now() });
  					subscriber.next(payload.data);
  				}
  				break;
  			}
  			case 'error': {
  				const payload = msg.payload as { message?: string };
  				sendSubscriptionToExtension({ subId, type: 'error', timestamp: Date.now() });
  				subscriber.error(new Error(payload?.message ?? 'Subscription error'));
  				break;
  			}
  			case 'complete': {
  				sendSubscriptionToExtension({ subId, type: 'complete', timestamp: Date.now() });
  				subscriber.complete();
  				break;
  			}
  			}
  		};

  		ws.onerror = () => {
  			sendSubscriptionToExtension({ subId, type: 'error', timestamp: Date.now() });
  			subscriber.error(new Error('WebSocket connection failed'));
  		};

  		ws.onclose = () => {
  			if (!completed) {
  				sendSubscriptionToExtension({ subId, type: 'close', timestamp: Date.now() });
  				subscriber.complete();
  			}
  		};

  		return () => {
  			completed = true;
  			clearTimeout(connTimeout);
  			if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
  				ws.send(JSON.stringify({ type: 'complete', id: '1' }));
  				ws.close(1000);
  			}
  			sendSubscriptionToExtension({ subId, type: 'close', timestamp: Date.now() });
  		};
  	});
  }
}
