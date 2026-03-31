import { Injectable } from '@angular/core';
import {
  ApiErrorResponse,
  DraftCommandRequest,
  DraftCommandResponse,
  DraftCreateRequest,
  DraftCreateResponse,
  FeatureLayer,
  FeatureQueryResponse,
  PagedRoadSectionsResponse,
  RoadSectionComparisonDetail,
  ViewportState,
  WorkspaceConfigResponse
} from '../../shared/models/api.models';

interface RoadSectionQueryParams {
  page?: number;
  size?: number;
  roadNumber?: string | null;
  status?: string | null;
  draftId?: string | null;
  referenceSegmentBusinessId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RoadGisApiService {
  private readonly baseUrl = '/api/v1';

  listRoadSections(params: RoadSectionQueryParams = {}): Promise<PagedRoadSectionsResponse> {
    const searchParams = this.toSearchParams({
      page: params.page ?? 0,
      size: params.size ?? 50,
      roadNumber: params.roadNumber ?? undefined,
      status: params.status ?? undefined,
      draftId: params.draftId ?? undefined,
      referenceSegmentBusinessId: params.referenceSegmentBusinessId ?? undefined
    });

    return this.request<PagedRoadSectionsResponse>(`/road-sections?${searchParams.toString()}`);
  }

  getRoadSection(
    businessId: string,
    draftId?: string | null
  ): Promise<RoadSectionComparisonDetail> {
    const searchParams = this.toSearchParams({
      draftId: draftId ?? undefined
    });

    const query = searchParams.toString();
    const suffix = query ? `?${query}` : '';
    return this.request<RoadSectionComparisonDetail>(`/road-sections/${businessId}${suffix}`);
  }

  queryFeatures(
    layer: FeatureLayer,
    viewport: ViewportState,
    draftId?: string | null,
    status?: string | null
  ): Promise<FeatureQueryResponse> {
    const searchParams = this.toSearchParams({
      layer,
      bbox: viewport.bbox,
      scaleDenominator: viewport.scaleDenominator,
      draftId: draftId ?? undefined,
      status: status ?? undefined
    });

    return this.request<FeatureQueryResponse>(`/query/features?${searchParams.toString()}`);
  }

  getWorkspaceConfiguration(): Promise<WorkspaceConfigResponse> {
    return this.request<WorkspaceConfigResponse>('/layers/workspace');
  }

  createDraft(request: DraftCreateRequest): Promise<DraftCreateResponse> {
    return this.request<DraftCreateResponse>('/drafts', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  saveDraftCommand(
    draftId: string,
    request: DraftCommandRequest
  ): Promise<DraftCommandResponse> {
    return this.request<DraftCommandResponse>(`/drafts/${draftId}/commands`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers
      }
    });

    const rawBody = await response.text();
    const body = rawBody ? (JSON.parse(rawBody) as T | ApiErrorResponse) : null;

    if (!response.ok) {
      const error = body as ApiErrorResponse | null;
      throw new RoadGisApiError(
        response.status,
        error?.code ?? 'HTTP_ERROR',
        error?.message ?? `Wywolanie API nie powiodlo sie. HTTP ${response.status}.`
      );
    }

    return body as T;
  }

  private toSearchParams(values: Record<string, string | number | undefined>): URLSearchParams {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.length > 0) {
        params.set(key, `${value}`);
      }
    });
    return params;
  }
}

export class RoadGisApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}
