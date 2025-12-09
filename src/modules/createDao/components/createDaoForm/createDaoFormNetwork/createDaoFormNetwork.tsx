import { Network } from '@/shared/api/daoService';
import { useTranslations } from '@/shared/components/translationsProvider';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { useFormField } from '@/shared/hooks/useFormField';
import { RadioCard, RadioGroup } from '@aragon/gov-ui-kit';
import type { ICreateDaoFormData } from '../createDaoFormDefinitions';

export interface ICreateDaoFormNetworkProps {}

export const CreateDaoFormNetwork: React.FC<ICreateDaoFormNetworkProps> = () => {
    const { t } = useTranslations();

    const { onChange: onNetworkChange, ...networkField } = useFormField<ICreateDaoFormData, 'network'>('network', {
        rules: { required: true },
        defaultValue: Network.HARMONY_MAINNET,
    });

    const testnetTag = { variant: 'neutral' as const, label: t('app.createDao.createDaoForm.network.tag.testnet') };
    const disabledTag = { variant: 'info' as const, label: t('app.createDao.createDaoForm.network.tag.disabled') };
    const betaTag = { variant: 'info' as const, label: t('app.createDao.createDaoForm.network.tag.beta') };

    const sortedNetworks = Object.entries(networkDefinitions).sort(
        ([, networkA], [, networkB]) => networkA.order - networkB.order,
    );
    const availableNetworks = sortedNetworks.filter(([, network]) => !network.disabled);

    return (
        <RadioGroup onValueChange={onNetworkChange} {...networkField}>
            {availableNetworks.map(([key, { disabled, testnet, beta, name, logo }]) => (
                <RadioCard
                    key={key}
                    tag={disabled ? disabledTag : testnet ? testnetTag : beta ? betaTag : undefined}
                    value={key}
                    label={name}
                    disabled={false}
                    avatar={logo}
                    description={
                        key === Network.ETHEREUM_SEPOLIA
                            ? t(`app.createDao.createDaoForm.network.${key}.description`)
                            : undefined
                    }
                />
            ))}
        </RadioGroup>
    );
};
