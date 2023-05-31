import { sepolia } from '@wagmi/core/chains';

export const customNetConfig = {
    ...sepolia,
    rpcUrls: {
        default: {
            http: ['https://rpc.sepolia.org']
        },
        public: {
            http: ['https://rpc.sepolia.org']
        }
    }
};
