const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export interface CreateMeetingRequest {
  hostName: string;
  maxParticipants?: number;
}

export interface CreateMeetingResponse {
  meetingId: string;
  hostToken: string;
  joinToken: string;
  shareLink: string;
  meeting: Record<string, unknown>;
}

export interface JoinMeetingRequest {
  token: string;
  displayName: string;
}

export interface JoinMeetingResponse {
  meetingId: string;
  participantId: string;
  participant: Record<string, unknown>;
  participants: Record<string, unknown>[];
  meeting: Record<string, unknown>;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data || result; // Handle both wrapped and unwrapped responses
  }

  async createMeeting(data: CreateMeetingRequest): Promise<CreateMeetingResponse> {
    const response = await this.request('/api/meetings', {
      method: 'POST',
      body: JSON.stringify({
        hostName: data.hostName,
        maxParticipants: data.maxParticipants || 50,
      }),
    });
    
    return {
      ...response,
      shareLink: response.joinUrl,
      meeting: { id: response.meetingId }
    };
  }

  async joinMeeting(data: JoinMeetingRequest): Promise<JoinMeetingResponse> {
    const response = await this.request('/api/meetings/join', {
      method: 'POST',
      body: JSON.stringify({
        token: data.token,
        displayName: data.displayName,
      }),
    });
    
    return {
      ...response,
      participants: [],
      meeting: { id: response.meetingId }
    };
  }

  async getMeetingInfo(meetingId: string, token: string): Promise<Record<string, unknown>> {
    return this.request(`/api/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async generateJoinToken(meetingId: string, hostToken: string, maxUses = 10): Promise<Record<string, unknown>> {
    return this.request(`/api/meetings/${meetingId}/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hostToken}`,
      },
      body: JSON.stringify({ maxUses }),
    });
  }

  async updateDateTime(meetingId: string, hostToken: string, newDateTime: string, version: number): Promise<Record<string, unknown>> {
    return this.request(`/api/meetings/${meetingId}/datetime`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${hostToken}`,
      },
      body: JSON.stringify({ newDateTime, version }),
    });
  }

  async leaveMeeting(meetingId: string, token: string): Promise<Record<string, unknown>> {
    return this.request(`/api/meetings/${meetingId}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async kickParticipant(meetingId: string, hostToken: string, participantId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/meetings/${meetingId}/kick`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hostToken}`,
      },
      body: JSON.stringify({ participantId }),
    });
  }

  async terminateMeeting(meetingId: string, hostToken: string): Promise<Record<string, unknown>> {
    return this.request(`/api/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${hostToken}`,
      },
    });
  }

  async healthCheck(): Promise<Record<string, unknown>> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();