import { Observable } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';

export interface SendMessageInternalRequest {
  chatId: string;
  senderId: string;
  content: string;
}

export interface SendMessageInternalResponse {
  success: boolean;
  messageId: string;
  error: string;
}

export interface MembershipRequest {
  chatId: string;
  userId: string;
}

export interface MembershipResponse {
  isMember: boolean;
}

export interface ChatInternalService {
  sendMessageInternal(
    data: SendMessageInternalRequest,
    metadata?: Metadata,
  ): Observable<SendMessageInternalResponse>;
  isMember(
    data: MembershipRequest,
    metadata?: Metadata,
  ): Observable<MembershipResponse>;
}
