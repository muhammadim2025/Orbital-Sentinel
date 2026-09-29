/**
 * API SERVICE CLIENT
 * Proxies calls to server caching layer with timeout protection and fallback indicators.
 */

export interface SourceStatus {
  source: 'LIVE' | 'CACHED' | 'SNAPSHOT' | 'HISTORICAL_EVENT';
  cachedAt?: number;
  note?: string;
}

export interface GeminiAssessmentResponse {
  risk: 'low' | 'moderate' | 'elevated' | 'high';
  confidence: number;
  primary_factor: string;
  affected_system: string;
  explanation: string;
  recommended_action: string;
  easy_explanation?: string;
  easy_recommendation?: string;
  evidence: string[];
}

export interface AnalyzeResult {
  assessment: GeminiAssessmentResponse;
  computed_risk: any;
  model_disagreed: boolean;
  _source: string;
  _error?: string;
}

export const apiClient = {
  async fetchTle(group = 'stations'): Promise<{ data: any[]; status: SourceStatus }> {
    try {
      const res = await fetch(`/api/tle?group=${encodeURIComponent(group)}`);
      const json = await res.json();
      return {
        data: Array.isArray(json.data) ? json.data : [],
        status: {
          source: json._source || 'SNAPSHOT',
          cachedAt: json._cachedAt,
          note: json._note
        }
      };
    } catch (err: any) {
      console.error('[API] fetchTle error:', err);
      return { data: [], status: { source: 'SNAPSHOT', note: err?.message } };
    }
  },

  async fetchDonki(type = 'FLR', start?: string, end?: string): Promise<{ data: any[]; status: SourceStatus }> {
    try {
      let url = `/api/donki?type=${encodeURIComponent(type)}`;
      if (start) url += `&start=${encodeURIComponent(start)}`;
      if (end) url += `&end=${encodeURIComponent(end)}`;

      const res = await fetch(url);
      const json = await res.json();
      return {
        data: Array.isArray(json.data) ? json.data : [],
        status: {
          source: json._source || 'SNAPSHOT',
          cachedAt: json._cachedAt,
          note: json._note
        }
      };
    } catch (err: any) {
      console.error('[API] fetchDonki error:', err);
      return { data: [], status: { source: 'SNAPSHOT', note: err?.message } };
    }
  },

  async fetchSwpc(product: string): Promise<{ data: any; status: SourceStatus }> {
    try {
      const res = await fetch(`/api/swpc/${encodeURIComponent(product)}`);
      const json = await res.json();
      return {
        data: json.data || {},
        status: {
          source: json._source || 'SNAPSHOT',
          cachedAt: json._cachedAt,
          note: json._note
        }
      };
    } catch (err: any) {
      console.error(`[API] fetchSwpc ${product} error:`, err);
      return { data: {}, status: { source: 'SNAPSHOT', note: err?.message } };
    }
  },

  async fetchEonet(): Promise<{ features: any[]; status: SourceStatus }> {
    try {
      const res = await fetch('/api/eonet?days=20&status=open');
      const json = await res.json();
      const features = json.data?.features || [];
      return {
        features,
        status: {
          source: json._source || 'SNAPSHOT',
          cachedAt: json._cachedAt
        }
      };
    } catch (err: any) {
      console.error('[API] fetchEonet error:', err);
      return { features: [], status: { source: 'SNAPSHOT', note: err?.message } };
    }
  },

  async fetchNeo(dateStr?: string): Promise<{ neoList: any[]; status: SourceStatus }> {
    try {
      let url = '/api/neo';
      if (dateStr) url += `?start=${dateStr}&end=${dateStr}`;
      const res = await fetch(url);
      const json = await res.json();

      let neoList: any[] = [];
      const neos = json.data?.near_earth_objects;
      if (neos) {
        Object.keys(neos).forEach((d) => {
          neoList = neoList.concat(neos[d]);
        });
      }

      return {
        neoList,
        status: {
          source: json._source || 'SNAPSHOT',
          cachedAt: json._cachedAt
        }
      };
    } catch (err: any) {
      console.error('[API] fetchNeo error:', err);
      return { neoList: [], status: { source: 'SNAPSHOT', note: err?.message } };
    }
  },

  async fetchLaunches(): Promise<{ launches: any[]; status: SourceStatus }> {
    try {
      const res = await fetch('/api/launches');
      const json = await res.json();
      const results = json.data?.results || [];
      return {
        launches: results,
        status: {
          source: json._source || 'SNAPSHOT',
          cachedAt: json._cachedAt,
          note: json._rateLimited ? 'Rate limited (LL2)' : undefined
        }
      };
    } catch (err: any) {
      console.error('[API] fetchLaunches error:', err);
      return { launches: [], status: { source: 'SNAPSHOT', note: err?.message } };
    }
  },

  async fetchSpaceX(resource = 'launches/past'): Promise<{ items: any[]; status: SourceStatus }> {
    try {
      const res = await fetch(`/api/spacex?resource=${encodeURIComponent(resource)}`);
      const json = await res.json();
      return {
        items: Array.isArray(json.data) ? json.data : [],
        status: {
          source: json._source || 'SNAPSHOT',
          cachedAt: json._cachedAt,
          note: 'Historical data, not a live feed'
        }
      };
    } catch (err: any) {
      console.error('[API] fetchSpaceX error:', err);
      return { items: [], status: { source: 'SNAPSHOT', note: 'Historical data, not a live feed' } };
    }
  },

  async analyzeSpacecraft(payload: any, force = false, customApiKey?: string): Promise<AnalyzeResult> {
    try {
      const url = force ? '/api/analyze?force=true' : '/api/analyze';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('[API] analyzeSpacecraft error:', err);
      return {
        assessment: {
          risk: payload.computed_risk?.level?.toLowerCase() || 'low',
          confidence: 0.75,
          primary_factor: 'Deterministic analysis (network offline)',
          affected_system: 'Attitude and Orbit Control System',
          explanation: 'Connection to Gemini analyst timed out. Displaying deterministic physics calculations.',
          recommended_action: 'Monitor telemetry via backup channels.',
          easy_explanation: 'The satellite is flying in orbit normally based on physics calculations.',
          easy_recommendation: 'Keep watching the radar and enjoy tracking it across the globe!',
          evidence: [`computed_risk.level: ${payload.computed_risk?.level}`]
        },
        computed_risk: payload.computed_risk,
        model_disagreed: false,
        _source: 'CLIENT_FALLBACK',
        _error: err?.message
      };
    }
  }
};
