import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'
import * as cookieParser from 'cookie-parser'
import * as session from 'express-session';
dotenv.config()

async function bootstrap() {

  const app = await NestFactory.create(AppModule , {cors:true});
  app.use(cookieParser())
  app.setGlobalPrefix('api/v1')
  app.use(
    session({
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );
  await app.startAllMicroservices()
  await app.listen(process.env.PORT ?? 3000);
  console.log('Api gateway ran stated')

}
bootstrap();
