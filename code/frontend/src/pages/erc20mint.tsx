import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const ERC20Mint = dynamic(import('../components/ERC20Mint'), { ssr: false });
const Header = dynamic(import('../components/Header'), { ssr: false });
const Footer = dynamic(import('../components/Footer'), { ssr: false });

const Erc20Mint: NextPage = () => {
    return (
        <div>
            <Head>
                <title>Mint tokens</title>

            </Head>
            <Header title={
                <div>
                    <h2>Off-chain Checks</h2>
                    <p>Low cost distribution of ERC-20 tokens</p>
                    <div>Mint tokens</div>
                </div>
            }
            />
            <main className='main'>
                <ERC20Mint />
            </main>
            <Footer />
        </div>
    );
};

export default Erc20Mint;
