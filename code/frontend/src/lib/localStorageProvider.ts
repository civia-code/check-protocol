import useSWR, {
    BareFetcher,
    Cache,
    Key,
    SWRConfiguration,
    unstable_serialize,
    useSWRConfig
} from 'swr';

import { BigNumber } from 'ethers';

export const reviveJsonBigNumber = (_: string, value: any) => {
    if (value?.type === 'BigNumber' && 'hex' in value) {
        return BigNumber.from(value.hex);
    }
    return value;
};

export const localStorageProvider = () => {
    // if (typeof window !== 'undefined') {
    //     const map = new Map(JSON.parse(localStorage.getItem('app-cache') || '[]'));

    //     window.addEventListener('beforeunload', () => {
    //         const appCache = JSON.stringify(Array.from(map.entries()));
    //         localStorage.setItem('app-cache', appCache);
    //     });

    //     return map as Map<any, any>;
    // } else {
    //     return new Map();
    // }

    const swrPersistedCache = {
        set: (key: any, value: any) => {
            return localStorage.setItem(unstable_serialize(key), JSON.stringify(value));
        },
        get: (key: any) => {
            try {
                const value = localStorage.getItem(unstable_serialize(key));
                if (!value) {
                    throw new Error('No value found');
                }
                return JSON.parse(value, reviveJsonBigNumber) ?? undefined;
            } catch {
                return undefined;
            }
        },
        delete: (key: any) => {
            return localStorage.removeItem(unstable_serialize(key));
        }
    };

    return swrPersistedCache;
};
