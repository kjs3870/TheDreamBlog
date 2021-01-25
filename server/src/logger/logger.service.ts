import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;
  private stream;

  constructor() {
    this.createLogger();
    this.stream = {
      write: (message: string) => {
        this.logger.info(message);
      },
    };
  }

  private createLogger() {
    const logDir = 'logs'; // logs 디렉토리 하위에 로그 파일 저장
    const { combine, timestamp, printf } = winston.format;

    // Define log format
    const logFormat = printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    });

    /*
     * Log Level
     * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
     */
    this.logger = winston.createLogger({
      format: combine(
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
      ),
      transports: [
        // info 레벨 로그를 저장할 파일 설정
        new winstonDaily({
          level: 'info',
          datePattern: 'YYYY-MM-DD',
          dirname: logDir,
          filename: `%DATE%.log`,
          maxFiles: 30, // 30일치 로그 파일 저장
          zippedArchive: true,
        }),
        // error 레벨 로그를 저장할 파일 설정
        new winstonDaily({
          level: 'error',
          datePattern: 'YYYY-MM-DD',
          dirname: logDir + '/error', // error.log 파일은 /logs/error 하위에 저장
          filename: `%DATE%.error.log`,
          maxFiles: 30,
          zippedArchive: true,
        }),
      ],
    });

    // Production 환경이 아닌 경우(dev 등)
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(), // 색깔 넣어서 출력
          ),
        }),
      );
    }
  }

  getStream() {
    return this.stream;
  }

  info(message: string) {
    this.logger.info(message);
  }

  error(message: string) {
    this.logger.error(message);
  }
}
