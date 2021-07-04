import { DBService } from './db.service';
import { Injectable } from '@nestjs/common';
import {EventEmitter} from 'events';

@Injectable()
export class AppService {
  emitter: EventEmitter;

  constructor(private readonly db: DBService) {
    this.emitter = new EventEmitter();
  }
  
  async auth(login: string): Promise<number> {

    // Sprawdzam czy jest w bazie
    const result: any[] = await this.db.sendQuery(`SELECT \`id\` FROM \`users\` WHERE \`login\` = '${login}'`);
    
    if (!result?.length) {
      // Jak nie ma to rejestrujemy
      return await this.register(login);
    } 
    // Logujemy
    return result[0].id;
  }

  private async register(login: string): Promise<number> {
    const result: any = await this.db.sendQuery(`INSERT INTO \`users\` (\`login\`) VALUES ('${login}')`);
    // Zwracamy id stworzonego rekordu
    return result.insertId;
  }

  async users(id: number): Promise<any[]> {
    const result: any[] = await this.db.sendQuery(`SELECT * FROM \`users\` WHERE \`id\` != ${id}`);
    if (!result || !result.length) return [];
    return result;
  }

  async getDialogues(userId: number): Promise<any[]> {
    // Nie udało się gotową kwerędą dostać dane, więc pobieram wszystko i filtruje
    // Kwerendę trzeba przerobić
    const q = `
      SELECT 
        \`messages\`.\`message\`, 
        \`messages\`.\`created\`, 
        \`rooms\`.\`id\`, 
        \`users\`.\`login\`
      FROM \`messages\` 
      LEFT JOIN \`users\` ON \`users\`.\`id\` = \`messages\`.\`autor_id\`
      LEFT JOIN \`room_users\` ON \`room_users\`.\`user_id\` = \`users\`.\`id\`
      LEFT JOIN \`rooms\` ON \`room_users\`.\`room_id\` = \`rooms\`.\`id\`
      WHERE \`rooms\`.\`id\` IN (
        SELECT \`rooms\`.\`id\` 
          FROM \`rooms\`
          LEFT JOIN \`room_users\` ON \`room_users\`.\`room_id\` = \`rooms\`.\`id\`
          WHERE \`room_users\`.\`user_id\` = ${userId}
      )
      ORDER BY \`messages\`.\`created\` DESC
    `;
    console.log(q)
    const result: any[] = await this.db.sendQuery(q);

    if (!result || ! result.length) return [];

    const filteredResult: any[] = [];

    result.forEach(item => {
      const elem: any = filteredResult.find(x => x.id === item.id);
      if (elem) return;
      filteredResult.push(item);
    });

    return filteredResult;
  }

  async getRoomId(myId: number, targetId: number): Promise<number> {
    const q = `
      SELECT * 
      FROM (
        SELECT \`room_id\` AS 'id' FROM \`room_users\` WHERE \`user_id\` = ${myId}
      ) \`t1\`
      LEFT JOIN (
        SELECT \`room_id\` AS 'id' FROM \`room_users\` WHERE \`user_id\` = ${targetId}
      ) \`t2\` ON \`t1\`.\`id\` = \`t2\`.\`id\`
      WHERE \`t1\`.\`id\` = \`t2\`.\`id\`
    `;

    let result: any[] = await this.db.sendQuery(q);
    result = result.filter(item => !!item.id);
    if (!result.length) {
      return await this.createRoom(myId, targetId);
    }
    return result[0].id;
  }

  private async createRoom(myId: number, targetId: number): Promise<number> {
    let q = '';
    let result: any;
    q = `INSERT INTO \`rooms\` (\`id\`) VALUES (NULL)`;
    result = await this.db.sendQuery(q);
    const id: number = result.insertId

    q = `INSERT INTO \`room_users\` (\`room_id\`, \`user_id\`) VALUES (${id}, ${myId})`;
    this.db.sendQuery(q);
    q = `INSERT INTO \`room_users\` (\`room_id\`, \`user_id\`) VALUES (${id}, ${targetId})`;
    this.db.sendQuery(q);

    return id;
  }

  async getMessages(roomId: number): Promise<any[]> {
    const q = `
      SELECT \`messages\`.\`message\`, \`messages\`.\`created\`, \`users\`.\`login\`, \`users\`.\`id\` as 'user_id'
      FROM \`messages\`
      LEFT JOIN \`users\` ON \`users\`.\`id\` = \`messages\`.\`autor_id\` 
      LEFT JOIN \`room_users\` ON \`room_users\`.\`user_id\` = \`users\`.\`id\`
      LEFT JOIN \`rooms\` ON \`rooms\`.\`id\` = \`room_users\`.\`room_id\`
      WHERE \`rooms\`.\`id\` = ${roomId}
      ORDER BY \`messages\`.\`created\` DESC
    `;

    const result: any[] = await this.db.sendQuery(q);
    if (!result || !result.length) return [];
    return result;
  }

  async setMessage(body: {autor_id: number, room_id: number, message: string}): Promise<any> {
    const created: number = Date.now();
    const q = `INSERT INTO \`messages\` (\`autor_id\`, \`room_id\`, \`message\`, \`created\`) VALUES (${body.autor_id}, ${body.room_id}, '${body.message}', '${created}')`;
    const result: any = await this.db.sendQuery(q);
    if (!result.insertId) return null;
    return {
      ...body,
      id: result.insertId,
      created
    }
  }

  async setMessageLp(body: {autor_id: number, room_id: number, message: string}): Promise<void> {
    const created: number = Date.now();
    const q = `INSERT INTO \`messages\` (\`autor_id\`, \`room_id\`, \`message\`, \`created\`) VALUES (${body.autor_id}, ${body.room_id}, '${body.message}', '${created}')`;
    const result: any = await this.db.sendQuery(q);
    if (!result.insertId) return null;
    this.emitter.emit('newMessage');
    return;
  }

  async setMessageEs(body: {autor_id: number, room_id: number, message: string}): Promise<void> {
    const created: number = Date.now();
    const q = `INSERT INTO \`messages\` (\`autor_id\`, \`room_id\`, \`message\`, \`created\`) VALUES (${body.autor_id}, ${body.room_id}, '${body.message}', '${created}')`;
    const result: any = await this.db.sendQuery(q);
    if (!result.insertId) return null;
    this.emitter.emit('newMessage');
    return;
  } 
} 