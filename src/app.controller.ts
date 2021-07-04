import { Body, Controller, Get, Header, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller('')
export class AppController {

  constructor(private readonly appService: AppService) {}

  @Post('auth')
  async auth(@Body() body: any): Promise<any> {
    return await this.appService.auth(body.login);
  }

  @Post('users')
  async users(@Body() body: any): Promise<any> {
    return await this.appService.users(body.id);
  }

  @Post('dialogues')
  async getDialogues(@Body() body: any): Promise<any[]> {
    return await this.appService.getDialogues(body.id);
  }

  @Post('room-id')
  async getRoomId(@Body() body: any): Promise<number> {
    return await this.appService.getRoomId(body.my_id, body.target_id);
  }

  // Ajax
  @Post('messages')
  async getMessages(@Body() body: any): Promise<any[]> {
    return await this.appService.getMessages(body.id);
  }

  @Post('send-message')
  async setMessage(@Body() body: any): Promise<number> {
    return await this.appService.setMessage(body);
  }

  // Long pooling
  @Post('messages-lp')
  async getMessagesLp(@Body() body: any, @Res() res: Response) {
    this.appService.emitter.once('newMessage', async () => {
      const data = await this.appService.getMessages(body.id);
      res.json(data);
    });
  }

  @Post('send-message-lp')
  async setMessageLp(@Body() body: any): Promise<void> {
    return await this.appService.setMessageLp(body);
  }

  // Event sourcing
  @Get('messages-es/:id') 
  @Header('Connection', 'keep-alive')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'none')
  async connectEs(@Param('id') id: string, @Res() res: Response) {
    this.appService.emitter.on('newMessage', async () => {
      const data = await this.appService.getMessages(+id);
      res.write(`data: ${JSON.stringify(data)} \n\n`);
    });
  }

  @Post('send-message-es')
  async setMessageEs(@Body() body: any): Promise<void> {
    return await this.appService.setMessageEs(body);
  }
}