import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.env.DB_HOST,
      port: Number(this.env.DB_PORT),
      username: this.env.DB_USERNAME,
      password: this.env.DB_PASSWORD,
      database: this.env.DB_NAME,
      logging: this.env.APP_ENV === 'development',

      // Auto-load all entities using the pattern standard in this project
      entities: [__dirname + '/../**/*.typeorm.entity{.ts,.js}'],

      // synchronize is set to true for development.
      // Replace with migrations in production.
      synchronize: this.env.APP_ENV === 'development',
      charset: 'utf8mb4',
    };
  }
}

const configService = new ConfigService(process.env);

export default configService;
