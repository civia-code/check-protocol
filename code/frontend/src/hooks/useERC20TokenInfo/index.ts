import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { readContracts } from '@wagmi/core';
import TestToken from '../../../abi/TestToken.json';
import { truncateHex } from '../../services/address.service';
import { localStorageProvider } from '../../lib/localStorageProvider';

export const useERC20TokenInfo = (testTokenAddress: `0x${string}`) => {
    const key = `@"${testTokenAddress}","tokenInfo"`;
    const { data, error } = useSWR(key, async () => {
        if (testTokenAddress) {
            const res = await readContracts({
                contracts: [
                    {
                        address: testTokenAddress,
                        abi: TestToken.abi as unknown as any,
                        functionName: 'name'
                    },
                    {
                        address: testTokenAddress,
                        abi: TestToken.abi,
                        functionName: 'symbol'
                    },
                    {
                        address: testTokenAddress,
                        abi: TestToken.abi,
                        functionName: 'decimals'
                    }
                ]
            }).then(([{ result: tokenName }, { result: tokenSymbol }, { result: decimals }]) => {
                const val = {
                    tokenName,
                    tokenSymbol,
                    decimals,
                    formatAddr: truncateHex(testTokenAddress)
                };
                return val;
            }).catch(() => {
                return null;
            });
            return Promise.resolve(res);
        } else {
            return null;
        }
    });

    return data || {
        tokenName: null,
        tokenSymbol: null,
        formatAddr: null,
        decimals: null
    };
};
