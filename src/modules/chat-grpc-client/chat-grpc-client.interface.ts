import { Observable } from 'rxjs';

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

export interface ChatInternalService {
  sendMessageInternal(
    data: SendMessageInternalRequest,
  ): Observable<SendMessageInternalResponse>;
}
