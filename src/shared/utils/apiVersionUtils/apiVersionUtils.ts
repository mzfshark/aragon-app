import type { ApiVersion, IBuildVersionedUrlOptions } from './apiVersionUtils.api';

class ApiVersionUtils {
    /**
     * Get API version from environment.
     * Defaults to v2 for safety (production stable).
     */
    getApiVersion = (): ApiVersion => {
        // The backend deployed in production is expected to expose v2.
        // Even if someone accidentally sets NEXT_PUBLIC_API_VERSION=v3 in prod,
        // default to v2 to avoid breaking core flows (DAO details, proposals, etc.).
        if (process.env.NODE_ENV === 'production') {
            return 'v2';
        }

        const version = process.env.NEXT_PUBLIC_API_VERSION;
        return version === 'v3' ? 'v3' : 'v2';
    };

    /**
     * Build a versioned URL path.
     * @param path - The base path (e.g., '/daos/:id' or '/v2/daos/:id')
     * @param options - Version configuration options
     * @returns The versioned URL path
     *
     * @example
     * buildVersionedUrl('/daos/:id') // '/v2/daos/:id' (production)
     * buildVersionedUrl('/daos/:id') // '/v3/daos/:id' (dev/staging)
     * buildVersionedUrl('/v2/permissions/:address', { forceVersion: 'v2' }) // '/v2/permissions/:address'
     */
    buildVersionedUrl = (path: string, options?: IBuildVersionedUrlOptions): string => {
        const version = options?.forceVersion ?? options?.version ?? this.getApiVersion();

        // Replace existing version prefix or prepend new one
        if (/^\/v\d+\//.test(path)) {
            return path.replace(/^\/v\d+\//, `/${version}/`);
        }

        return `/${version}${path.startsWith('/') ? '' : '/'}${path}`;
    };
}

export const apiVersionUtils = new ApiVersionUtils();
