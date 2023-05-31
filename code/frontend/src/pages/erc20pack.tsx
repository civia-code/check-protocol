import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const ERC20Pack = dynamic(import('../components/ERC20Pack'), { ssr: false });
const Header = dynamic(import('../components/Header'), { ssr: false });
const Footer = dynamic(import('../components/Footer'), { ssr: false });

const Erc20Pack: NextPage = () => {
    return (
        <div>
            <Head>
                <title>Bundle checks</title>

            </Head>
            <Header title={
                <div>
                    <h2>Off-chain Checks</h2>
                    <p>Low cost distribution of ERC-20 tokens</p>
                    <div>Bundle checks</div>
                </div>
            }
            />
            <main className='main'>
                <ERC20Pack />
            </main>
            <Footer />
        </div>
    );
};

export default Erc20Pack;
