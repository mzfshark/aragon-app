import { responseUtils } from '@/shared/utils/responseUtils';
import { type NextRequest, NextResponse } from 'next/server';

export class ProxyBackendUtils {
    private proxyUrl = '/api/backend';

    request = async (request: NextRequest) => {
        const url = this.buildBackendUrl(request);
        const requestOptions = await this.buildRequestOptions(request);

        const result = await fetch(url, requestOptions);

        if (this.isNoContent(result.status)) {
            return this.forwardNoContent(result);
        }

        const contentType = result.headers.get('content-type') ?? '';

        if (this.isJson(contentType)) {
            return this.forwardJson(result);
        }

        return this.forwardText(result);
    };

    private isNoContent = (status: number): boolean => status === 204 || status === 205 || status === 304;

    private forwardNoContent = (result: Response): NextResponse =>
        new NextResponse(null, { status: result.status, headers: result.headers });

    private isJson = (contentType: string): boolean => contentType.includes('application/json');

    private forwardJson = async (result: Response): Promise<NextResponse> => {
        const parsedResult = await responseUtils.safeJsonParseForResponse(result);
        if (parsedResult == null) {
            return new NextResponse(null, { status: result.status, headers: result.headers });
        }
        return NextResponse.json(parsedResult, { status: result.status, headers: result.headers });
    };

    private forwardText = async (result: Response): Promise<NextResponse> => {
        const bodyText = await result.text().catch(() => '');
        return new NextResponse(bodyText, { status: result.status, headers: result.headers });
    };

    private buildBackendUrl = (request: NextRequest): string => {
        const [, relativeUrl] = request.nextUrl.href.split(this.proxyUrl);
        const baseUrl = process.env.ARAGON_BACKEND_URL;
        if (!baseUrl) {
            throw new Error(
                'ARAGON_BACKEND_URL não configurada. Defina no ambiente do servidor para habilitar o proxy /api/backend.',
            );
        }
        // Validate protocol; if missing, try to prefix http:// to avoid ERR_INVALID_URL in dev
        let normalizedBase = baseUrl;
        try {
            // Will throw if protocol is missing/invalid
            // eslint-disable-next-line no-new
            new URL(baseUrl);
        } catch {
            const candidate = `http://${baseUrl}`;
            try {
                // eslint-disable-next-line no-new
                new URL(candidate);
                normalizedBase = candidate;
            } catch {
                throw new Error(
                    `ARAGON_BACKEND_URL inválida: "${baseUrl}". Use uma URL completa com protocolo, ex.: https://api.governance.country`,
                );
            }
        }

        const url = `${normalizedBase}${relativeUrl}`;

        return url;
    };

    private buildRequestOptions = async (request: NextRequest): Promise<RequestInit> => {
        const { method, headers } = request;
        const body = method.toUpperCase() === 'POST' ? await request.text() : undefined;

        const processedHeaders = new Headers(headers);

        if (process.env.NEXT_SECRET_ARAGON_BACKEND_API_KEY) {
            processedHeaders.set('X-API-Key', process.env.NEXT_SECRET_ARAGON_BACKEND_API_KEY);
        }

        return { method, body, headers: processedHeaders };
    };
}

export const proxyBackendUtils = new ProxyBackendUtils();
