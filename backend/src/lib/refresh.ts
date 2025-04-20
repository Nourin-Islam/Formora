// events/refresh.ts
import EventEmitter from "events";
export const refreshEvents = new EventEmitter();

// Then in any place that mutates related data, just trigger the event:

// import { refreshEvents } from './refresh.ts';

// After prisma.template.create/update/delete
// refreshEvents.emit('refreshView');
