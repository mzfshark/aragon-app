import { HttpService, type IRequestQueryParams } from '../httpService';
import { AragonBackendServiceError } from '../aragonBackendService/aragonBackendServiceError';
import type { IPaginatedResponse } from '../aragonBackendService/domain';

export class AragonAdminBackendService extends HttpService {
    constructor() {
        super(
            typeof window === 'undefined' ? AragonAdminBackendService.getServerBaseUrl() : '/api/admin-backend',
            AragonBackendServiceError.fromResponse,
            process.env.NEXT_SECRET_ARAGON_ADMIN_BACKEND_API_KEY ?? process.env.NEXT_SECRET_ARAGON_BACKEND_API_KEY,
        );
    }

    private static getServerBaseUrl(): string {
        const raw =
            process.env.ARAGON_ADMIN_BACKEND_URL ??
            process.env.ARAGON_BACKEND_URL ??
            process.env.NEXT_PUBLIC_ARAGON_BACKEND_URL;

        if (!raw) {
            throw new Error(
                'ARAGON_ADMIN_BACKEND_URL não configurada. Defina no ambiente do servidor (ou use ARAGON_BACKEND_URL/NEXT_PUBLIC_ARAGON_BACKEND_URL como fallback) para habilitar requisições server-side ao admin backend.',
            );
        }

        let normalized = raw;
        try {
            // eslint-disable-next-line no-new
            new URL(raw);
        } catch {
            const candidate = `http://${raw}`;
            try {
                // eslint-disable-next-line no-new
                new URL(candidate);
                normalized = candidate;
            } catch {
                throw new Error(
                    `ARAGON_ADMIN_BACKEND_URL inválida: "${raw}". Use uma URL completa com protocolo, ex.: https://admin-api.governance.country`,
                );
            }
        }

        return normalized.replace(/\/$/, '');
    }

    getNextPageParams = <TParams extends IRequestQueryParams<object>, TData = unknown>(
        lastPage: IPaginatedResponse<TData>,
        _allPages: Array<IPaginatedResponse<TData>>,
        previousParams: TParams,
    ): TParams | undefined => {
        const { page, totalPages } = lastPage.metadata;

        if (page >= totalPages) {
            return undefined;
        }

        return {
            ...previousParams,
            queryParams: {
                ...previousParams.queryParams,
                page: page + 1,
            },
        };
    };
}
