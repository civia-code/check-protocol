import { FC, useEffect, useState } from 'react';
import { getNetwork } from '@wagmi/core';

import { customNetConfig } from '../../lib/customNetConfig';

const DefaultBSCTestChainConfig = {
    chainId: '0x' + (customNetConfig.id).toString(16),
    chainName: customNetConfig.name,
    nativeCurrency: customNetConfig.nativeCurrency,
    rpcUrls: [customNetConfig.rpcUrls.public.http ?? customNetConfig.rpcUrls.default.http].flat(),
    blockExplorerUrls: [customNetConfig.blockExplorers.default.url || customNetConfig.blockExplorers.etherscan.url]
};

export const useAddCustomNet: FC<any> = ({ BSCTestChainConfig = DefaultBSCTestChainConfig }) => {
    useEffect(() => {
        (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
                BSCTestChainConfig
            ]
        });
    }, [BSCTestChainConfig]);

    return null;
};

export const useAddBSCTestNetAndSwitch: any = () => {
    const [chainId, setChainId] = useState<undefined | number>();
    const switchBscTestNet = () => {
        (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
                DefaultBSCTestChainConfig
            ]
        });
    };
    useEffect(() => {
        const { chain, chains } = getNetwork();
        chain && setChainId(chain.id);
        if (chain && chain.id !== customNetConfig.id) {
            switchBscTestNet();
        }
    }, []);

    return [chainId, switchBscTestNet];
};
