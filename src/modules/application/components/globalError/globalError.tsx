'use client';

import { ErrorFeedback } from '@/shared/components/errorFeedback';
import { TranslationsProvider } from '@/shared/components/translationsProvider';
import { monitoringUtils } from '@/shared/utils/monitoringUtils';
import { useEffect } from 'react';

export interface IGlobalErrorProps {
    /**
     * Unhandled error thrown by root layout component.
     */
    error: Error;
}

export const GlobalError: React.FC<IGlobalErrorProps> = (props) => {
    const { error } = props;

    useEffect(() => {
        monitoringUtils.logError(error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                {/* Render with a minimal translations provider to avoid hook error */}
                <TranslationsProvider translations={{} as any}>
                    <ErrorFeedback />
                </TranslationsProvider>
            </body>
        </html>
    );
};
