'use client';

import { useTranslations } from '@/shared/components/translationsProvider';
import { useFormField } from '@/shared/hooks/useFormField';
import { daoUtils } from '@/shared/utils/daoUtils';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { AddressInput, type IAddressInputResolvedValue, InputContainer, addressUtils } from '@aragon/gov-ui-kit';
import { useCallback, useMemo, useState } from 'react';
import type { IHarmonyVotingSetupGovernanceForm, IHarmonyVotingSetupGovernanceProps } from './harmonyVotingSetupGovernance.api';

export const HarmonyVotingSetupGovernance: React.FC<IHarmonyVotingSetupGovernanceProps> = (props) => {
    const { formPrefix, daoId } = props;

    const { t } = useTranslations();

    const network = useMemo(() => (daoId ? daoUtils.parseDaoId(daoId).network : undefined), [daoId]);
    const chainId = network ? networkDefinitions[network].id : undefined;

    const proposerField = useFormField<IHarmonyVotingSetupGovernanceForm, 'proposer'>('proposer', {
        fieldPrefix: formPrefix,
        label: t('app.plugins.harmonyVoting.setupGovernance.proposer.label'),
        rules: {
            required: true,
            validate: (value) => addressUtils.isAddress(value),
        },
        sanitizeOnBlur: false,
    });

    const oracleField = useFormField<IHarmonyVotingSetupGovernanceForm, 'oracle'>('oracle', {
        fieldPrefix: formPrefix,
        label: t('app.plugins.harmonyVoting.setupGovernance.oracle.label'),
        rules: {
            required: true,
            validate: (value) => addressUtils.isAddress(value),
        },
        sanitizeOnBlur: false,
    });

    const [proposerInput, setProposerInput] = useState<string | undefined>(proposerField.value);
    const [oracleInput, setOracleInput] = useState<string | undefined>(oracleField.value);

    const handleProposerAccept = useCallback(
        (value?: IAddressInputResolvedValue) => proposerField.onChange(value?.address ?? ''),
        [proposerField],
    );

    const handleOracleAccept = useCallback(
        (value?: IAddressInputResolvedValue) => oracleField.onChange(value?.address ?? ''),
        [oracleField],
    );

    return (
        <div className="flex w-full flex-col gap-4">
            <InputContainer
                id="harmonyVotingGovernance"
                label={t('app.plugins.harmonyVoting.setupGovernance.title')}
                helpText={t('app.plugins.harmonyVoting.setupGovernance.helpText')}
                useCustomWrapper={true}
            >
                <div className="flex flex-col gap-3">
                    <AddressInput
                        value={proposerInput}
                        onChange={setProposerInput}
                        onAccept={handleProposerAccept}
                        placeholder={t('app.plugins.harmonyVoting.setupGovernance.proposer.placeholder')}
                        chainId={chainId}
                        {...proposerField}
                    />
                    <AddressInput
                        value={oracleInput}
                        onChange={setOracleInput}
                        onAccept={handleOracleAccept}
                        placeholder={t('app.plugins.harmonyVoting.setupGovernance.oracle.placeholder')}
                        chainId={chainId}
                        {...oracleField}
                    />
                </div>
            </InputContainer>
        </div>
    );
};
