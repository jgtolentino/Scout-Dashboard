#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * IoT MQTT CLI Tool for Bruno Execution
 * 
 * Usage:
 * deno run --allow-net --allow-env --allow-read scripts/iot/mqtt.ts publish --device "sensor-01" --data '{"temperature": 22.5, "humidity": 65}'
 * deno run --allow-net --allow-env --allow-read scripts/iot/mqtt.ts subscribe --device "sensor-01"
 * deno run --allow-net --allow-env --allow-read scripts/iot/mqtt.ts bridge --broker "mqtt://localhost:1883"
 */

import { parse } from "https://deno.land/std@0.200.0/flags/mod.ts";

interface PublishOptions {
  device: string;
  data: string;
  eventType?: string;
  endpoint?: string;
  token?: string;
}

interface SubscribeOptions {
  device: string;
  endpoint?: string;
  token?: string;
}

interface BridgeOptions {
  broker: string;
  endpoint?: string;
  token?: string;
}

class IoTMQTTClient {
  private baseUrl: string;
  private token: string;

  constructor(endpoint?: string, token?: string) {
    this.baseUrl = endpoint || Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
    this.token = token || Deno.env.get('SUPABASE_ANON_KEY') || '';
  }

  private async checkWritesAllowed(): Promise<boolean> {
    const allowWrites = Deno.env.get('IOT_ALLOW_WRITES');
    return allowWrites === 'true';
  }

  async publish(options: PublishOptions): Promise<void> {
    // Safety check for writes
    if (!await this.checkWritesAllowed()) {
      console.error('❌ IoT writes are disabled. Set IOT_ALLOW_WRITES=true to enable publishing.');
      Deno.exit(1);
    }

    console.log(`📡 Publishing telemetry from device: ${options.device}`);

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(options.data);
    } catch (error) {
      console.error('❌ Invalid JSON data:', error.message);
      Deno.exit(1);
    }

    const telemetryData = {
      device_name: options.device,
      event_type: options.eventType || 'telemetry',
      payload: payload,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.baseUrl}/functions/v1/iot-ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'x-client-info': 'mqtt-cli/1.0.0'
        },
        body: JSON.stringify(telemetryData)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Publish failed:', error.error || 'Unknown error');
        Deno.exit(1);
      }

      const result = await response.json();
      console.log('✅ Telemetry published successfully');
      console.log(`   Event ID: ${result.event_id}`);
      console.log(`   Device ID: ${result.device_id}`);
      console.log(`   Metrics processed: ${result.metrics_processed}`);
      console.log(`   Processed at: ${result.processed_at}`);

    } catch (error) {
      console.error('❌ Network error:', error.message);
      Deno.exit(1);
    }
  }

  async subscribe(options: SubscribeOptions): Promise<void> {
    console.log(`👂 Subscribing to device events: ${options.device}`);
    console.log('   (This is a simulation - real MQTT subscription would connect to broker)');
    
    // Simulate subscription by polling recent events
    const maxPolls = 10;
    let pollCount = 0;

    console.log('   Polling for recent events...\n');

    const poll = async () => {
      try {
        // This would be replaced with actual MQTT subscription in a real implementation
        // For now, we'll query the API for recent events
        const response = await fetch(`${this.baseUrl}/rest/v1/scout_dash.iot_events?device_id=eq.${options.device}&order=timestamp.desc&limit=5`, {
          method: 'GET',
          headers: {
            'apikey': this.token,
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const events = await response.json();
          for (const event of events) {
            console.log(`📨 [${event.timestamp}] ${event.event_type}: ${JSON.stringify(event.payload)}`);
          }
        }

        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          console.log('\n✅ Subscription simulation complete');
        }

      } catch (error) {
        console.error('❌ Polling error:', error.message);
      }
    };

    await poll();
  }

  async bridge(options: BridgeOptions): Promise<void> {
    console.log(`🌉 Bridging MQTT broker to Supabase IoT ingest`);
    console.log(`   Broker: ${options.broker}`);
    console.log(`   Endpoint: ${this.baseUrl}`);
    
    // This is a simulation - real implementation would use MQTT library
    console.log('\n📋 Bridge configuration:');
    console.log(`   - Connect to MQTT broker at ${options.broker}`);
    console.log(`   - Subscribe to topics: devices/+/telemetry, devices/+/events`);
    console.log(`   - Forward messages to ${this.baseUrl}/functions/v1/iot-ingest`);
    console.log(`   - Use Bearer token authentication`);
    console.log(`   - Handle connection failures with exponential backoff`);
    
    console.log('\n⚠️  This is a simulation. Real MQTT bridging requires:');
    console.log('   1. MQTT client library (e.g., mqtt npm package)');
    console.log('   2. Connection management and reconnection logic');
    console.log('   3. Message parsing and transformation');
    console.log('   4. Error handling and dead letter queue integration');

    // Simulate bridge operation
    for (let i = 1; i <= 3; i++) {
      console.log(`\n🔄 Simulated message ${i}:`);
      
      const simulatedMessage = {
        topic: `devices/sensor-${i.toString().padStart(2, '0')}/telemetry`,
        payload: {
          temperature: 20 + Math.random() * 10,
          humidity: 50 + Math.random() * 30,
          timestamp: new Date().toISOString()
        }
      };

      console.log(`   Topic: ${simulatedMessage.topic}`);
      console.log(`   Payload: ${JSON.stringify(simulatedMessage.payload, null, 2)}`);

      // Simulate forwarding to ingest endpoint
      const deviceName = simulatedMessage.topic.split('/')[1];
      const telemetryData = {
        device_name: deviceName,
        event_type: 'telemetry',
        payload: simulatedMessage.payload,
        timestamp: simulatedMessage.payload.timestamp
      };

      console.log(`   → Forwarding to IoT ingest for device: ${deviceName}`);
      
      // Add delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Bridge simulation complete');
  }

  async healthCheck(): Promise<void> {
    console.log('🏥 Checking IoT Expert health...\n');

    try {
      // Check if IoT writes are enabled
      const writesAllowed = await this.checkWritesAllowed();
      console.log(`   IOT_ALLOW_WRITES: ${writesAllowed ? '✅ Enabled' : '❌ Disabled'}`);

      // Check Supabase connection
      const response = await fetch(`${this.baseUrl}/rest/v1/scout_dash.iot_device_registry?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': this.token,
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Supabase connection: ${response.ok ? '✅ Connected' : '❌ Failed'}`);

      // Check IoT ingest function
      const ingestResponse = await fetch(`${this.baseUrl}/functions/v1/iot-ingest`, {
        method: 'OPTIONS'
      });

      console.log(`   IoT ingest function: ${ingestResponse.ok ? '✅ Available' : '❌ Unavailable'}`);

      if (response.ok) {
        const devices = await response.json();
        console.log(`   Registered devices: ${Array.isArray(devices) ? devices.length : 0}`);
      }

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      Deno.exit(1);
    }

    console.log('\n✅ IoT Expert health check complete');
  }
}

// CLI Interface
const args = parse(Deno.args);
const command = args._[0] as string;

if (!command) {
  console.log(`
IoT MQTT CLI Tool for Bruno Execution

Usage:
  mqtt.ts publish --device "sensor-01" --data '{"temperature": 22.5}'
  mqtt.ts subscribe --device "sensor-01"
  mqtt.ts bridge --broker "mqtt://localhost:1883"
  mqtt.ts health

Options:
  --device      Device name for publish/subscribe operations
  --data        JSON payload for publish operations
  --event-type  Event type (default: "telemetry")
  --endpoint    Supabase endpoint URL (default: from SUPABASE_URL env)
  --token       Supabase token (default: from SUPABASE_ANON_KEY env)
  --broker      MQTT broker URL for bridge operations

Environment Variables:
  SUPABASE_URL           Supabase project URL
  SUPABASE_ANON_KEY      Supabase anonymous key
  IOT_ALLOW_WRITES       Must be "true" to enable telemetry publishing
  `);
  Deno.exit(0);
}

const client = new IoTMQTTClient(args.endpoint, args.token);

switch (command) {
  case 'publish':
    if (!args.device || !args.data) {
      console.error('❌ --device and --data are required for publish command');
      Deno.exit(1);
    }
    await client.publish({
      device: args.device,
      data: args.data,
      eventType: args['event-type'],
      endpoint: args.endpoint,
      token: args.token
    });
    break;

  case 'subscribe':
    if (!args.device) {
      console.error('❌ --device is required for subscribe command');
      Deno.exit(1);
    }
    await client.subscribe({
      device: args.device,
      endpoint: args.endpoint,
      token: args.token
    });
    break;

  case 'bridge':
    if (!args.broker) {
      console.error('❌ --broker is required for bridge command');
      Deno.exit(1);
    }
    await client.bridge({
      broker: args.broker,
      endpoint: args.endpoint,
      token: args.token
    });
    break;

  case 'health':
    await client.healthCheck();
    break;

  default:
    console.error(`❌ Unknown command: ${command}`);
    console.error('Available commands: publish, subscribe, bridge, health');
    Deno.exit(1);
}