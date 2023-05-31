import { FC, useEffect } from 'react';
import { useERC20TokenInfo } from '../../hooks/useERC20TokenInfo';

export const ERC20TokenInfo: FC<any> = ({ tokenAddress, children }) => {
    const { tokenName, tokenSymbol, decimals, formatAddr } = useERC20TokenInfo(tokenAddress);

    return children && children(tokenName, tokenSymbol, formatAddr, decimals);
};
