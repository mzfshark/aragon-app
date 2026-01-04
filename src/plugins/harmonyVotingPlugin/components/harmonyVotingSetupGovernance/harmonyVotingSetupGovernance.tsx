'use client';

import { useTranslations } from '@/shared/components/translationsProvider';
import { InputContainer } from '@aragon/gov-ui-kit';
import type { IHarmonyVotingSetupGovernanceProps } from './harmonyVotingSetupGovernance.api';

export const HarmonyVotingSetupGovernance: React.FC<IHarmonyVotingSetupGovernanceProps> = (props) => {
    void props as IHarmonyVotingSetupGovernanceProps & { formPrefix?: string } & { daoId?: string };

    const { t } = useTranslations();

    return (
        <div className="flex w-full flex-col gap-4">
            <InputContainer
                id="harmonyVotingGovernance"
                label={t('app.plugins.harmonyVoting.setupGovernance.title')}
                helpText={t('app.plugins.harmonyVoting.setupGovernance.helpText')}
                useCustomWrapper={true}
            >
                <div />
            </InputContainer>
        </div>
    );
};
