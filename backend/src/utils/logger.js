import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

const prettyTransport = {
  target: 'pino-pretty',
  options: {
    colorize: Boolean(process.stdout.isTTY),
    colorizeObjects: Boolean(process.stdout.isTTY),
    levelFirst: true,
    translateTime: 'SYS:HH:MM:ss.l',
    ignore: 'pid,hostname',
    singleLine: false,
    useOnlyCustomProps: false,
    customColors:
      'trace:gray,debug:cyan,info:green,warn:yellow,error:red,fatal:redBright',
  },
};

const logger = isProd
  ? pino({
      level,
      base: { service: 'financial-decision-engine-api' },
    })
  : pino({
      level,
      transport: prettyTransport,
    });

export { logger };
