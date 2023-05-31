import { FC, useEffect } from 'react';
import { ethers } from 'ethers';
import { readContract } from '@wagmi/core';
import useSWR from 'swr';
import TestToken from '../../../abi/TestToken.json';
import { useERC20TokenInfo } from '../../hooks/useERC20TokenInfo';

export const ERC20TokenBalance: FC<any> = ({ tokenAddress, userAddress, children }) => {
    const { tokenName, tokenSymbol, decimals = 1, formatAddr } = useERC20TokenInfo(tokenAddress);
    //
    const key = `${userAddress}-${tokenAddress}-balance`;
    const { data } = useSWR(key, async () => {
        if (tokenAddress && userAddress) {
            return await readContract({
                address: tokenAddress,
                abi: TestToken.abi,
                functionName: 'balanceOf',
                args: [userAddress]
            }).then((res: any) => {
                return res.toString() / Math.pow(10, decimals as any as number);
            }).catch((err) => {
                console.log(err);
            });
        } else {
            return undefined;
        }
    }, { revalidateIfStale: true });

    return children && children(String(data));
};
