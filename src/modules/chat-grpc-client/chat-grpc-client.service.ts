import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ChatInternalService,
  SendMessageInternalResponse,
} from './chat-grpc-client.interface';

@Injectable()
export class ChatGrpcClientService implements OnModuleInit {
  private chatInternalService!: ChatInternalService;

  constructor(
    @Inject('CHAT_GRPC_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.chatInternalService =
      this.client.getService<ChatInternalService>('ChatInternal');
  }

  async sendMessageInternal(
    chatId: string,
    senderId: string,
    content: string,
  ): Promise<SendMessageInternalResponse> {
    return firstValueFrom(
      this.chatInternalService.sendMessageInternal({
        chatId,
        senderId,
        content,
      }),
    );
  }
}
