'use client';

import { useTranslations } from '@/shared/components/translationsProvider';
import { InputContainer } from '@aragon/gov-ui-kit';
import type { IHarmonyVotingSetupMembershipProps } from './harmonyVotingSetupMembership.api';

export const HarmonyVotingSetupMembership: React.FC<IHarmonyVotingSetupMembershipProps> = () => {
    const { t } = useTranslations();

    return (
        <InputContainer
            id="harmonyVotingMembership"
            label={t('app.plugins.harmonyVoting.setupMembership.title')}
            helpText={t('app.plugins.harmonyVoting.setupMembership.helpText')}
            useCustomWrapper={true}
        />
    );
};
