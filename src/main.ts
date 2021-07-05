import { AppService } from './app.service';
import { NestFactory } from '@nestjs/core';
import {Server} from 'ws';
import { AppModule } from './app.module';
import { DBService } from './db.service';

async function bootstrap() {
  const wss = new Server({
    port: 3001,
  });
  
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  wss.on('connection', (ws: any) => {
    ws.room = [];
    const appService: AppService = new AppService(new DBService);

    ws.on('message', async (data: any) => {
      data = JSON.parse(data); 

      if (data.event === 'connection') {
        const id = +data.room_id;
        ws.room.push(id);
        const messages: any[] = await appService.getMessages(id);
        broadcastMessage(messages, id); 
      }

      if (data.event === 'message') {
        const id = +data.room_id
        await appService.setMessage(data.data);
        const messages: any[] = await appService.getMessages(id);
        broadcastMessage(messages, +data.room_id);
      }
    });
  });

  function broadcastMessage(msg, id: number) {
    wss.clients.forEach((client: any) => {
      if (client.room.indexOf(id) < 0) return;
      client.send(JSON.stringify(msg));
    });
  }
  
  await app.listen(3000);
}
bootstrap();