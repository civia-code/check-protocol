import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const ERC20Send = dynamic(import('../components/ERC20Send'), { ssr: false });
const Header = dynamic(import('../components/Header'), { ssr: false });
const Footer = dynamic(import('../components/Footer'), { ssr: false });

const Erc20Send: NextPage = () => {
    return (
        <div>
            <Head>
                <title>Write checks</title>

            </Head>
            <Header title={
                <div>
                    <h2>Off-chain Checks</h2>
                    <p>Low cost distribution of ERC-20 tokens</p>
                    <div>Write checks</div>
                </div>
            }
            />
            <main className='main'>
                <ERC20Send />
            </main>
            <Footer />
        </div>
    );
};

export default Erc20Send;
