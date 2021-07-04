import { DBService } from './db.service';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
    DBService
  ],
})
export class AppModule {}
