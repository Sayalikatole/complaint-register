// src/app/services/notification.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
// Fix for SockJS import
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

export interface Notification {
  id: string;
  type: 'urgent' | 'assignment' | 'status' | 'system' | 'comment';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  ticketId?: string;
  link?: string;
  recipientId?: string; // Added to match backend model
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private baseUrl = 'http://192.168.1.36:8081/api/notifications';
  private wsUrl = 'http://192.168.1.36:8081/ws';
  private stompClient: Client | null = null;
  private subscription: StompSubscription | null = null;
  private notificationSubject = new Subject<Notification>();
  private connectionStatus = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) { }

  /**
   * Get user notifications from REST API
   */
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}`).pipe(
      catchError(this.handleError<Notification[]>('getNotifications', []))
    );
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/read`, {}).pipe(
      catchError(this.handleError<any>('markAsRead'))
    );
  }

  /**
   * Mark notifications as seen (reduces counter)
   */
  markAsSeen(): Observable<any> {
    return this.http.put(`${this.baseUrl}/seen`, {}).pipe(
      catchError(this.handleError<any>('markAsSeen'))
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/read-all`, {}).pipe(
      catchError(this.handleError<any>('markAllAsRead'))
    );
  }

  /**
   * Clear all notifications
   */
  clearAll(): Observable<any> {
    return this.http.delete(`${this.baseUrl}`).pipe(
      catchError(this.handleError<any>('clearAll'))
    );
  }

  /**
   * Error handling
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Return empty result so the app keeps running
      return of(result as T);
    };
  }

  /**
   * Initialize STOMP client with SockJS
   */
  initializeWebSocketConnection(userId: string): void {
    // Close any existing connection
    this.disconnect();

    // Create a new STOMP client over SockJS
    this.stompClient = new Client({
      // Fix for SockJS initialization
      webSocketFactory: () => new SockJS(this.wsUrl) as WebSocket,
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000, // Attempt to reconnect after 5 seconds
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });


    // On successful connection
    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket: ' + frame);
      this.connectionStatus.next(true);

      // Add null check before using stompClient
      if (!this.stompClient) {
        console.error('STOMP client is null after connection');
        return;
      }

      // Subscribe to personal notifications topic - using the same structure as backend

      this.subscription = this.stompClient.subscribe(
        `/topic/notifications/${userId}`,
        (message: IMessage) => {
          console.log('Raw message received:', message);
          try {
            const notification: Notification = JSON.parse(message.body);
            console.log('Parsed notification:', notification);
            this.notificationSubject.next(notification);
          } catch (e) {
            console.error('Error parsing notification message', e);
          }
        }
      );

      // Optional: Subscribe to global notifications
      // Add null check here too
      if (this.stompClient) {
        this.stompClient.subscribe(
          `/topic/global-notifications`,
          (message: IMessage) => {
            try {
              const notification: Notification = JSON.parse(message.body);
              this.notificationSubject.next(notification);
            } catch (e) {
              console.error('Error parsing global notification message', e);
            }
          }
        );
      }
    };

    // Add more detailed error handling
    this.stompClient.onStompError = (frame) => {
      console.error('🔴 STOMP Error:', frame);
      this.connectionStatus.next(false);
    };

    this.stompClient.onWebSocketClose = (event) => {
      console.error('🔴 WebSocket connection closed:', event);
      this.connectionStatus.next(false);
    };

    this.stompClient.onWebSocketError = (event) => {
      console.error('🔴 WebSocket error:', event);
      this.connectionStatus.next(false);
    };

    console.log('Activating STOMP client...');
    this.stompClient.activate();
  }

  /**
   * Get the observable stream of real-time notifications
   */
  getNotificationsRealtime(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  /**
   * Get connection status as an observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Send a message through the STOMP client 
   * (useful for acknowledgments or client-to-server messages)
   */
  sendMessage(destination: string, body: any): void {
    // Added null check to fix TypeScript error
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(body)
      });
    } else {
      console.error('STOMP client not connected');
    }
  }

  /**
   * Send a notification to another user
   * This matches the backend NotificationService.sendNotification method
   */
  sendNotification(recipientId: string, notification: Partial<Notification>): void {
    // For frontend-initiated notifications
    const payload = {
      ...notification,
      recipientId,
      timestamp: new Date(),
      read: false,
      id: notification.id || `notif_${Date.now()}`
    };

    // Send via the /app prefix as configured in the backend
    this.sendMessage(`/app/send-notification`, payload);
  }

  /**
   * Disconnect WebSocket connection
   */
  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    // Added null check to fix TypeScript error
    if (this.stompClient) {
      if (this.stompClient.connected) {
        this.stompClient.deactivate();
      }
      this.stompClient = null;
    }

    this.connectionStatus.next(false);
  }

  /**
   * Handle component destruction - clean up subscriptions
   */
  ngOnDestroy(): void {
    this.disconnect();
  }
}