import { ConfigProvider } from 'antd';
import { WagmiConfig, createConfig, configureChains, mainnet } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { bscTestnet } from '@wagmi/core/chains';
import { SWRConfig } from 'swr';

import { customNetConfig } from '../lib/customNetConfig';
import { localStorageProvider } from '../lib/localStorageProvider';

import '../styles/globals.css';

import type { AppProps } from 'next/app';

function MyApp ({ Component, pageProps }: AppProps) {
    const { chains, publicClient, webSocketPublicClient } = configureChains(
        [customNetConfig],
        [publicProvider()]
    );

    const config = createConfig({
        autoConnect: true,
        publicClient,
        webSocketPublicClient
    });

    return (
        <div>
            <ConfigProvider
                theme={{
                    token: {
                        // colorPrimary: 'rgba(0, 125, 40, 1)',
                        fontSize: 14
                    }
                }}
            >
                <SWRConfig value={{ provider: localStorageProvider as any }}>
                    <WagmiConfig config={config}>
                        <Component {...pageProps} />
                    </WagmiConfig>
                </SWRConfig>
            </ConfigProvider>
        </div>
    );
}

export default MyApp;
