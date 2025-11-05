import fs from 'fs';
import path from 'path';

import { logger } from '@server/tools/logger';

import { Event, EventRegistration } from './events.types';

const DATA_DIR = path.resolve(process.env.CONFIG_FILE_PATH ?? './config');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');

// Ensure config directory and files exist
const ensureDataFiles = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(EVENTS_FILE)) {
        fs.writeFileSync(EVENTS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(REGISTRATIONS_FILE)) {
        fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify([]));
    }
};

// Normalize event to ensure it has all required fields
const normalizeEvent = (event: any): Event => {
    return {
        ...event,
        config: event.config || {
            type: 'registration',
        },
    };
};

// ============= EVENTS =============

export const loadEvents = (): Event[] => {
    ensureDataFiles();
    try {
        const data = fs.readFileSync(EVENTS_FILE, 'utf-8');
        const events = JSON.parse(data);
        return events.map((event: any) => normalizeEvent(event));
    } catch (error) {
        logger.error(error, 'Error loading events');
        return [];
    }
};

export const saveEvents = (events: Event[]) => {
    ensureDataFiles();
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
};

export const addEvent = (event: Event): Event => {
    const events = loadEvents();
    const newEvent = normalizeEvent({
        ...event,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString() as any,
        updatedAt: new Date().toISOString() as any,
    });
    events.push(newEvent);
    saveEvents(events);
    return newEvent;
};

export const getEventById = (id: string): Event | undefined => {
    const events = loadEvents();
    return events.find((e) => e.id === id);
};

export const updateEvent = (
    id: string,
    updates: Partial<Event>,
): Event | undefined => {
    const events = loadEvents();
    const eventIndex = events.findIndex((e) => e.id === id);
    if (eventIndex === -1) return undefined;

    const updatedEvent = normalizeEvent({
        ...events[eventIndex],
        ...updates,
        updatedAt: new Date().toISOString() as any,
    });
    events[eventIndex] = updatedEvent;
    saveEvents(events);
    return updatedEvent;
};

export const deleteEvent = (id: string): boolean => {
    const events = loadEvents();
    const filtered = events.filter((e) => e.id !== id);
    if (filtered.length === events.length) return false;
    saveEvents(filtered);
    return true;
};

// ============= REGISTRATIONS =============

export const loadRegistrations = (): EventRegistration[] => {
    ensureDataFiles();
    try {
        const data = fs.readFileSync(REGISTRATIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        logger.error(error, 'Error loading registrations');
        return [];
    }
};

export const saveRegistrations = (registrations: EventRegistration[]) => {
    ensureDataFiles();
    fs.writeFileSync(
        REGISTRATIONS_FILE,
        JSON.stringify(registrations, null, 2),
    );
};

export const addRegistration = (
    registration: Omit<EventRegistration, 'id' | 'registeredAt'>,
): EventRegistration => {
    const registrations = loadRegistrations();
    const newRegistration: EventRegistration = {
        ...registration,
        id: Math.random().toString(36).substring(7),
        registeredAt: new Date().toISOString() as any,
    };
    registrations.push(newRegistration);
    saveRegistrations(registrations);
    return newRegistration;
};

export const getRegistrationsByEventId = (
    eventId: string,
): EventRegistration[] => {
    const registrations = loadRegistrations();
    return registrations.filter((r) => r.eventId === eventId);
};
