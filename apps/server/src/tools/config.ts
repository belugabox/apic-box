import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const CONFIG_FILE = path.resolve(
    process.env.DATA_FILE_PATH ?? './data',
    'config.json',
);

interface Config {
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

const schema: JSONSchemaType<Config> = {
    type: 'object',
    required: ['LOG_LEVEL'],

    properties: {
        LOG_LEVEL: {
            type: 'string',
            default: 'info',
            enum: ['debug', 'info', 'warn', 'error'],
        },
    },
};

// Extract default values from the schema
const extractDefaults = (schema: JSONSchemaType<Config>): Partial<Config> => {
    const defaults: Partial<Config> = {};
    for (const key in schema.properties) {
        const property = schema.properties[key];
        if ('default' in property) {
            defaults[key as keyof Config] = property.default as any;
        }
    }
    return defaults;
};

// Create the configuration file if it doesn't exist
if (!fs.existsSync(CONFIG_FILE)) {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true }); // Ensure the directory exists
    const defaultConfig = extractDefaults(schema);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    console.log(`Default configuration file created at: ${CONFIG_FILE}`);
}

// Load the configuration from the JSON file
const config: Config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));

// Validate the configuration using Ajv
const ajv = new Ajv();
const validate: ValidateFunction<Config> = ajv.compile(schema);
const isValid = validate(config);

if (!isValid) {
    console.error('Configuration validation failed:', validate.errors);
    //process.exit(1); // Exit the process if validation fails
}

// Export the configuration
export { isValid, config };
