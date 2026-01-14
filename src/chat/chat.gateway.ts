/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface User {
  id: string;
  name: string;
}

@WebSocketGateway(4000, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private users: User[] = [];

  @WebSocketServer()
  server: Server;


  handleConnection(client: Socket) {
    const name = client.handshake.query.name as string;

    this.users.push({ name, id: client.id });

    client.broadcast.emit('user-joined', {
      name,
      message: `${name} joined the chat`,
    });

    this.server.emit('changeStatus', this.users.length);
  }


  handleDisconnect(client: Socket) {
    const obj = this.users.find((u) => u.id === client.id);
    const index = this.users.findIndex((u) => u.id === client.id);

    client.broadcast.emit('user-left', `${obj?.name} left the chat`);

    if (index !== -1) {
      this.users.splice(index, 1);
    }

   
    this.server.emit('changeStatus', this.users.length);
  }

 
  @SubscribeMessage('conversation')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    const obj = this.users.find((u) => u.id === client.id);

    client.broadcast.emit('conversation', {
      name: obj?.name,
      message,
    });
  }

  
  @SubscribeMessage('disconnected')
  disconnected(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    client.broadcast.emit('disconnected', this.users.length);
  }
}
