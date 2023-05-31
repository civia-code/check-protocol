import { useEffect, useState, ChangeEvent, useRef } from 'react';
import type { NextPage } from 'next';
import { Button, Input, message, Steps, Spin, Form } from 'antd';
import { useContractRead, useContractWrite, useConnect, useAccount, useSignMessage } from 'wagmi';
import { getContract, getWalletClient, readContract, writeContract } from '@wagmi/core';
import { ethers } from 'ethers';

import CiviaERC20Check from '../../../abi/ERC20Check.json';
import TestToken from '../../../abi/TestToken.json';

import styles from './index.module.css';

const CIVIA_ERC20_CONTRACT_ADDRESS = '0xBEfC4820810543f923791F638EE82705dD2302Fe';

const Erc20Create: NextPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(0);
    const { connect: metaMaskConnect, connectors: metaMaskConnectors, error: ucError, isLoading: ucIsLoading, pendingConnector } = useConnect();
    const { isConnected: isMetaMaskConnected, address: metamaskAddress } = useAccount();
    const connectMetamaskRef = useRef(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [grantedTokens, setGrantedTokens] = useState([]);
    //
    const [testTokenAddress, setTestTokenAddress] = useState('');
    const [testTokenAdmin, setTestTokenAdmin] = useState('');
    const [testTokenAmount, setTestTokenAmount] = useState('');

    useEffect(() => {
        if (metamaskAddress) {
            setStep(1);
        }
    }, [metamaskAddress]);

    // registe contract
    const { data, error, isLoading: isWriting, isSuccess, write, writeAsync } = useContractWrite({
        address: CIVIA_ERC20_CONTRACT_ADDRESS,
        abi: CiviaERC20Check.abi,
        functionName: 'register'
    });

    useEffect(() => {
        if (metamaskAddress) {
            setTestTokenAdmin(metamaskAddress);
            setIsLoading(true);
            readContract({
                address: CIVIA_ERC20_CONTRACT_ADDRESS,
                abi: CiviaERC20Check.abi,
                functionName: 'getRegisteredERC20s',
                args: [metamaskAddress]
            }).then((res) => {
                setGrantedTokens(res as []);
            }).catch((err) => {
                //
                console.log(err);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [metamaskAddress]);

    // useEffect(() => {
    //   if(testTokenAddress && grantedTokens.length){
    //     const isTestTokenGranted = grantedTokens.some((add: string) => add === testTokenAddress);
    //     isTestTokenGranted && setStep(3);
    //   }
    // }, [grantedTokens, testTokenAddress]);

    // auto connect metamask
    if (!connectMetamaskRef.current && !metamaskAddress && metaMaskConnectors && metaMaskConnectors.length) {
        connectMetamaskRef.current = true;
        metaMaskConnect({ connector: metaMaskConnectors[0] });
    }

    // step 1
    const registCiviaErc20 = async () => {
        if (!testTokenAddress) {
            messageApi.open({
                type: 'error',
                content: 'Please specify token contract address'
            });
        } else if (!testTokenAdmin) {
            messageApi.open({
                type: 'error',
                content: 'Please specify token admin'
            });
        } else if (!testTokenAmount) {
            messageApi.open({
                type: 'error',
                content: 'Please specify token amount'
            });
        } else {
            // check if registered
            if (testTokenAddress && grantedTokens.length) {
                const isTestTokenGranted = grantedTokens.some((add: string) => add === testTokenAddress);
                if (isTestTokenGranted) {
                    return setStep(2);
                }
            }
            //
            setIsLoading(true);
            const res = await writeAsync({ args: [testTokenAddress, testTokenAdmin, ethers.utils.parseUnits(testTokenAmount.toString(), 18).toString()] }).then((res) => {
                setStep(2);
                return res;
            }).catch((err) => {
                console.log(err);
                const errorStr = String(err);
                const isExists = errorStr.includes('token already exists');
                messageApi.open({
                    type: 'error',
                    content: isExists ? 'token already exists' : String(err)
                });
                isExists && setTimeout(() => {
                    setStep(2);
                }, 1000);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    };

    // step 2
    const grantRole = async () => {
        //
        setIsLoading(true);
        const roleRes = await readContract({
            address: testTokenAddress as `0x${string}`,
            abi: TestToken.abi,
            functionName: 'MINTER_ROLE'
        }).catch((err) => {
            messageApi.open({
                type: 'error',
                content: String(err)
            });
        });
        if (!roleRes) {
            return setIsLoading(false);
        }
        const hasRole = await readContract({
            address: testTokenAddress as `0x${string}`,
            abi: TestToken.abi,
            functionName: 'hasRole',
            args: [roleRes, CIVIA_ERC20_CONTRACT_ADDRESS]
        });
        console.log(hasRole);
        if (hasRole) {
            setIsLoading(false);
            return setStep(3);
        }
        const grantRes = await writeContract({
            address: testTokenAddress as `0x${string}`,
            abi: TestToken.abi,
            functionName: 'grantRole',
            args: [roleRes, CIVIA_ERC20_CONTRACT_ADDRESS]
        }).catch((err) => {
            messageApi.open({
                type: 'error',
                content: String(err)
            });
        });
        setIsLoading(false);
        console.log(grantRes);
        if (grantRes && grantRes.hash) {
            messageApi.open({
                type: 'success',
                content: grantRes.hash
            });
            setStep(3);
        } else {
            messageApi.open({
                type: 'error',
                content: 'Authorize fail'
            });
        }
    };

    console.log(testTokenAdmin);

    return (
        <div>
            <Spin spinning={isLoading}>
                {contextHolder}
                <div className={styles.body}>
                    <div className={styles.steps}>
                        <Steps
                            size="small"
                            current={step}
                            items={[
                                {
                                    title: 'Connect Wallet'
                                },
                                {
                                    title: 'Input token contract address'
                                },
                                {
                                    title: 'Authorize Check to mint'
                                }, {
                                    title: 'Success'
                                }
                            ]}
                        />
                    </div>
                    <div className={styles.form}>
                        <Form
                            name="basic"
                            layout="vertical"
                            labelCol={{ span: 8 }}
                            wrapperCol={{ span: 16 }}
                            style={{ maxWidth: 600 }}
                            autoComplete="off"
                        >
                            {
                                step === 1 ? (
                                    <>
                                        <Form.Item
                                            label="Token contract address"
                                            name="tokenAddress"
                                            rules={[{ required: true, message: 'Please input token contract address!' }]}
                                        >
                                            <Input value={testTokenAddress} onChange={(event: ChangeEvent<HTMLInputElement>) => { setTestTokenAddress(event.target.value); }} maxLength={44} />
                                        </Form.Item>
                                        <Form.Item
                                            label="Issuer signing address"
                                            name="tokenAdmin"
                                            rules={[{ required: true, message: 'Please input token admin address!' }]}
                                            initialValue={testTokenAdmin}
                                        >
                                            <Input value={testTokenAdmin} onChange={(event: ChangeEvent<HTMLInputElement>) => { setTestTokenAdmin(event.target.value); }} maxLength={44} />
                                        </Form.Item>
                                        <Form.Item
                                            label="Max mint amount"
                                            name="tokenAmount"
                                            rules={[{ required: true, message: 'Please input token amount!' }]}
                                        >
                                            <Input value={testTokenAmount} onChange={(event: ChangeEvent<HTMLInputElement>) => { setTestTokenAmount(event.target.value); }} maxLength={44} />
                                        </Form.Item>
                                        <Form.Item>
                                            <div className={styles.btnWrapper}>
                                                <Button onClick={registCiviaErc20} type="primary">Register</Button>
                                            </div>
                                        </Form.Item>
                                    </>
                                ) : null
                            }
                            {
                                step === 2 ? (
                                    <>
                                        <div className={styles.btnWrapper}>
                                            <Button onClick={grantRole} type="primary">Authorize</Button>
                                        </div>
                                    </>
                                ) : null
                            }
                        </Form>
                    </div>
                </div>
            </Spin>
        </div>
    );
};

export default Erc20Create;
