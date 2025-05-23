import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from './storage';
import { z } from 'zod';

// Arduino message schemas
const ArduinoTelemetrySchema = z.object({
  type: z.literal('telemetry'),
  temperature: z.number(),
  humidity: z.number(),
  soilMoisture: z.number(),
  co2Level: z.number(),
  lightLevel: z.number().optional(),
});

const ArduinoAckSchema = z.object({
  type: z.literal('ack'),
  command: z.string(),
  success: z.boolean(),
  message: z.string().optional(),
});

const ArduinoErrorSchema = z.object({
  type: z.literal('error'),
  message: z.string(),
  code: z.string().optional(),
});

const ArduinoMessageSchema = z.union([
  ArduinoTelemetrySchema,
  ArduinoAckSchema,
  ArduinoErrorSchema,
]);

type ArduinoMessage = z.infer<typeof ArduinoMessageSchema>;

let serialPort: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let wsServer: WebSocketServer | null = null;

export async function initializeSerial(wss: WebSocketServer): Promise<void> {
  wsServer = wss;
  
  const portPath = process.env.SERIAL_PORT || '/dev/ttyUSB0';
  const baudRate = parseInt(process.env.SERIAL_BAUD || '9600');

  try {
    serialPort = new SerialPort({
      path: portPath,
      baudRate,
      autoOpen: false,
    });

    parser = new ReadlineParser();
    serialPort.pipe(parser);

    // Open the port
    await new Promise<void>((resolve, reject) => {
      serialPort!.open((err) => {
        if (err) {
          console.error('Failed to open serial port:', err);
          reject(err);
        } else {
          console.log(`Serial port ${portPath} opened successfully`);
          resolve();
        }
      });
    });

    // Set up data parsing
    parser.on('data', handleArduinoData);

    // Error handling
    serialPort.on('error', (err) => {
      console.error('Serial port error:', err);
    });

    serialPort.on('close', () => {
      console.log('Serial port closed');
    });

  } catch (error) {
    console.error('Failed to initialize serial communication:', error);
    // Don't throw - allow the app to continue without serial
  }
}

async function handleArduinoData(data: string): Promise<void> {
  try {
    const trimmedData = data.trim();
    if (!trimmedData) return;

    console.log('Received from Arduino:', trimmedData);

    // Parse JSON data
    let parsedData: any;
    try {
      parsedData = JSON.parse(trimmedData);
    } catch (parseError) {
      console.error('Failed to parse Arduino data as JSON:', trimmedData);
      return;
    }

    // Validate against schema
    const validation = ArduinoMessageSchema.safeParse(parsedData);
    if (!validation.success) {
      console.error('Invalid Arduino message format:', validation.error);
      return;
    }

    const message = validation.data;

    switch (message.type) {
      case 'telemetry':
        await handleTelemetryData(message);
        break;
        
      case 'ack':
        await handleAckMessage(message);
        break;
        
      case 'error':
        await handleErrorMessage(message);
        break;
    }

  } catch (error) {
    console.error('Error handling Arduino data:', error);
  }
}

async function handleTelemetryData(data: z.infer<typeof ArduinoTelemetrySchema>): Promise<void> {
  try {
    // Store in database
    const telemetry = await storage.insertTelemetryData({
      temperature: data.temperature.toString(),
      humidity: data.humidity.toString(),
      soilMoisture: data.soilMoisture.toString(),
      co2Level: data.co2Level,
      lightLevel: data.lightLevel?.toString(),
    });

    // Broadcast to WebSocket clients
    const message = JSON.stringify({
      type: 'telemetry_update',
      data: telemetry,
    });

    if (wsServer) {
      wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }

    console.log('Telemetry data processed and broadcasted');

  } catch (error) {
    console.error('Error processing telemetry data:', error);
  }
}

async function handleAckMessage(ack: z.infer<typeof ArduinoAckSchema>): Promise<void> {
  console.log(`Arduino ACK for command "${ack.command}":`, ack.success ? 'Success' : 'Failed');
  
  if (ack.message) {
    console.log('ACK message:', ack.message);
  }

  // Broadcast ACK to WebSocket clients if needed
  const message = JSON.stringify({
    type: 'arduino_ack',
    data: ack,
  });

  if (wsServer) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

async function handleErrorMessage(error: z.infer<typeof ArduinoErrorSchema>): Promise<void> {
  console.error('Arduino error:', error.message);
  
  if (error.code) {
    console.error('Error code:', error.code);
  }

  // Broadcast error to WebSocket clients
  const message = JSON.stringify({
    type: 'arduino_error',
    data: error,
  });

  if (wsServer) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export async function sendArduinoCommand(command: any): Promise<boolean> {
  if (!serialPort || !serialPort.isOpen) {
    console.error('Serial port not available');
    return false;
  }

  try {
    const commandString = JSON.stringify(command) + '\n';
    
    await new Promise<void>((resolve, reject) => {
      serialPort!.write(commandString, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('Command sent to Arduino:', commandString.trim());
    return true;

  } catch (error) {
    console.error('Failed to send command to Arduino:', error);
    return false;
  }
}

export function getSerialStatus(): { connected: boolean; port?: string } {
  return {
    connected: serialPort?.isOpen || false,
    port: serialPort?.path,
  };
}
