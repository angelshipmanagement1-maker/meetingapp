// Application constants
export const APP_CONFIG = {
  name: 'MeetTime',
  version: '1.0.0',
  description: 'Real-time video meetings with live editable date & time',
} as const;

export const ROUTES = {
  HOME: '/',
  PREJOIN: '/prejoin',
  MEETING: '/meeting',
  NOT_FOUND: '*',
} as const;

export const STORAGE_KEYS = {
  DISPLAY_NAME: 'displayName',
  INITIAL_MUTE: 'initialMute',
  INITIAL_VIDEO_OFF: 'initialVideoOff',
  JOIN_TOKEN: 'joinToken',
  USER_PREFERENCES: 'userPreferences',
} as const;

export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  POOR: 'poor',
} as const;

export const LAYOUT_MODES = {
  GRID: 'grid',
  SPOTLIGHT: 'spotlight',
  SIDEBAR: 'sidebar',
} as const;