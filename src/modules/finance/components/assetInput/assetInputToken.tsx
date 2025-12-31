import { useTranslations } from '@/shared/components/translationsProvider';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { Avatar } from '@aragon/gov-ui-kit';
import classNames from 'classnames';
import type { ComponentProps } from 'react';
import type { IToken } from '../../api/financeService';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface IAssetInputTokenProps extends ComponentProps<'div'> {
    /**
     * The token to be rendered.
     */
    token?: IToken;
}

export const AssetInputToken: React.FC<IAssetInputTokenProps> = (props) => {
    const { token, className, ...otherProps } = props;

    const { t } = useTranslations();

    const isNativeToken = token?.address?.toLowerCase() === ZERO_ADDRESS;
    const nativeSymbol = token ? networkDefinitions[token.network]?.nativeCurrency?.symbol : undefined;
    const rawSymbol = token?.symbol?.trim();
    const isUnknownSymbol = rawSymbol?.toUpperCase() === 'UNKNOWN';
    const symbol = token ? (isNativeToken && (!rawSymbol || isUnknownSymbol) ? nativeSymbol : rawSymbol) ?? '' : '';

    return (
        <div className={classNames('flex items-center gap-x-1.5', className)} {...otherProps}>
            {token && <Avatar src={token.logo} size="xs" />}
            {token ? symbol : t('app.finance.assetInput.token.trigger')}
        </div>
    );
};
