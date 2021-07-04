import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql';
import { Connection } from 'mysql';

interface IConfig {
  onError?: Function
  onSuccess?: Function
}

@Injectable()
export class DBService {
  private con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'chat_test'
  });

  constructor() {}

  async conn(): Promise<Connection> {
    return new Promise( (res, rej) => {
      const con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: 'chat_test'
      });

      con.connect(function(error) {
        if (error) {
          rej(error);
        }
        res(con);
      });
    } );
  }

  async q(conn: Connection, query: string, config: IConfig = {}): Promise<any> {
    return new Promise( (res, rej) => {
      conn.query(query, function(error, result, fields) {
        if (error) {
          if (config.onError) {
            config.onError.call(null, error);
          }

          rej(error);
        }

        if (config.onSuccess) {
          config.onSuccess.call(null, result, fields);
        }

        res(result);
      });
    } );
  }

  async sendQuery(query: string, config: IConfig = {}): Promise<any> {
    return new Promise( async (res) => {
      let conn: Connection
      let result: any;
      const conf: IConfig = {}

      if (config.onError) {
        conf.onError = config.onError.bind(null);
      }

      if (config.onSuccess) {
        conf.onSuccess = config.onSuccess.bind(null);
      }

      try {
        conn = await this.conn();
        result = await this.q(conn, query, conf);
        await this.close(conn);
      } catch (e) {
        console.log(e);
        try {
          this.close(conn);
        } catch (e) {
          console.error(e);
        }
      } finally {
        res(result);
      }
    } );
  }

  async close(conn: Connection): Promise<void | never> {
    return new Promise( (res, rej) => {
      conn.end(function(error) {
        if (error) {
          rej(error);
        }

        res(null);
      });
    } );
  }
}
