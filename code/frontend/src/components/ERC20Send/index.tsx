
import { FC, useEffect, useState, useRef } from 'react';
import { Button, Input, message, Steps, Spin, Form, Select, Space, Avatar, List } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useConnect, useAccount, useSignMessage } from 'wagmi';
import { readContract, readContracts, multicall } from '@wagmi/core';
import { getSynthesizeAddressList, getUsersOwnerTokenCurrentId, leaveMessageERC20 } from '../../services/account.service';

import { ERC20TokenInfo } from '../../components/ERC20TokenInfo';
import { InputTags } from '../../components/InputTags';
import { localStorageProvider } from '../../lib/localStorageProvider';
import { useERC20TokenInfo } from '../../hooks/useERC20TokenInfo';

import CiviaERC20Check from '../../../abi/ERC20Check.json';
import TestToken from '../../../abi/TestToken.json';
import { getFormatedAddress } from '../../lib/address';

import styles from './index.module.css';
import { ethers } from 'ethers';

const localStorageProviderMap = localStorageProvider();

const CIVIA_ERC20_CONTRACT_ADDRESS = '0xBEfC4820810543f923791F638EE82705dD2302Fe';

const ERC20Send: FC<any> = () => {
    const locationSearch = new URLSearchParams(location.search);
    const searchCiviaWalletAddress = getFormatedAddress(locationSearch.get('civiaAddress') as string);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(0);
    const { connect: metaMaskConnect, connectors: metaMaskConnectors, error: ucError, isLoading: ucIsLoading, pendingConnector } = useConnect();
    const { isConnected: isMetaMaskConnected, address: metamaskAddress } = useAccount();
    const connectMetamaskRef = useRef(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [grantedTokens, setGrantedTokens] = useState([]);
    const [followings, setFollowings] = useState<Array<{ address: string; id: string; nickName: string; }>>([]);
    const [form] = Form.useForm();
    const [orderParts, setOrderParts] = useState<any[]>([]);

    const { signMessage: metaMaskSignMessage } = useSignMessage({
        onSuccess: (signData: any) => {
            const sigHex = signData.substring(2);
            const r = '0x' + sigHex.slice(0, 64);
            const s = '0x' + sigHex.slice(64, 128);
            const v = parseInt(sigHex.slice(128, 130), 16);
            setSignDataList(pre => [...pre, { r, s, v }]);
        },
        onError: () => { setSignDataList(pre => [...pre, null]); }
    });
    const [signDataList, setSignDataList] = useState<any[]>([]);
    const [userCurrentIds, setUserCurrentIds] = useState<any[]>([]);

    useEffect(() => {
        if (userCurrentIds.length && userCurrentIds.length === signDataList.length) {
            setStep(3);
        }
    }, [signDataList, userCurrentIds]);

    useEffect(() => {
        getSynthesizeAddressList(searchCiviaWalletAddress!).then((res: any[]) => {
            const followings = res.filter((item: any) => item.metamaskAddressList.length);
            setFollowings(followings);
        });
    }, [searchCiviaWalletAddress]);

    useEffect(() => {
        if (metamaskAddress) {
            setIsLoading(true);
            readContract({
                address: CIVIA_ERC20_CONTRACT_ADDRESS,
                abi: CiviaERC20Check.abi,
                functionName: 'getRegisteredERC20s',
                args: [metamaskAddress]
            }).then((res) => {
                setGrantedTokens(res as []);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [metamaskAddress]);
    // auto connect metamask
    if (!connectMetamaskRef.current && !metamaskAddress && metaMaskConnectors && metaMaskConnectors.length) {
        connectMetamaskRef.current = true;
        metaMaskConnect({ connector: metaMaskConnectors[0] });
    }

    useEffect(() => {
        if (metamaskAddress && step < 1) {
            setStep(1);
        }
    }, [metamaskAddress, step]);

    const getUsersOwnerTokenCurrentIdAndSignData = async () => {
        setIsLoading(true);
        const { selectToken, inputAmount, selectFriend } = form.getFieldsValue();
        //
        const contracts = selectFriend.map((item: string) => ({
            address: CIVIA_ERC20_CONTRACT_ADDRESS,
            abi: CiviaERC20Check.abi as any,
            functionName: 'getLastCheckId',
            args: [item, selectToken]
        }));
        setIsLoading(false);
        //
        const res: any = await multicall({ contracts });

        const mapedRes = selectFriend.reduce((pre: any, item: string, index: number) => {
            const localLastCheckId = localStorageProviderMap.get(`@${selectToken}${item},lastCheckId`) || 0;
            const lastCheckId = Number(res[index].result);
            const computedLastCheckId = Math.max(localLastCheckId, lastCheckId);
            localStorageProviderMap.set(`@${selectToken}${item},lastCheckId`, computedLastCheckId);
            return {
                ...pre,
                [item]: computedLastCheckId
            };
        }, {});

        console.log(mapedRes);
        if (res && mapedRes) {
            const userCurrentIds = Object.keys(mapedRes).map((item: any) => (
                {
                    currentId: mapedRes[item],
                    user: item
                }
            ));
            setUserCurrentIds(userCurrentIds);
            //
            userCurrentIds.forEach(({ currentId, user }: any) => {
                const orderParts = [
                    { value: selectToken, type: 'address' },
                    { value: metamaskAddress, type: 'address' },
                    { value: user, type: 'address' },
                    { value: currentId + 1, type: 'uint256' },
                    { value: currentId + 1, type: 'uint256' },
                    { value: ethers.utils.parseUnits(inputAmount.toString(), 18).toString(), type: 'uint256' }
                ];
                setOrderParts(orderParts);
                const types = orderParts.map(o => o.type);
                const values = orderParts.map(o => o.value);
                const hash = ethers.utils.solidityKeccak256(types, values);
                metaMaskSignMessage({ message: ethers.utils.arrayify(hash) as any });
            });
        } else {
            messageApi.open({
                type: 'error',
                content: res.msg
            });
            return null;
        }
    };

    const sendSignData = async () => {
        let hasError = false;
        const { selectToken, inputAmount, selectFriend } = form.getFieldsValue();

        for (let index = 0; index < userCurrentIds.length; index++) {
            //
            const { currentId, user } = userCurrentIds[index];
            const signData = signDataList[index];
            if (!signData) {
                return;
            }
            const tokenInfo = localStorageProviderMap.get(`@"${selectToken}","tokenInfo"`);
            const message = {
                tokenAddr: selectToken,
                issuerAddr: metamaskAddress!,
                receiverAddr: user,
                beginId: currentId + 1,
                endId: currentId + 1,
                amt: ethers.utils.parseUnits(inputAmount.toString(), tokenInfo.decimals).toString(),
                sig: {
                    r: signData.r,
                    s: signData.s,
                    v: signData.v
                }
            };

            const options = {
                suggestedName: `${tokenInfo?.data?.tokenName || selectToken}_${user}_${message.beginId}_${message.endId}.json`,
                types: [
                    {
                        description: 'Test files',
                        accept: {
                            'text/plain': ['.json']
                        }
                    }
                ]
            };
            try {
                const handle = await (window as any).showSaveFilePicker(options);
                const writable = await handle.createWritable();

                await writable.write(JSON.stringify(message));
                await writable.close();
                const localCheckId = localStorageProviderMap.get(`@${selectToken}${user},lastCheckId`) || 0;
                localStorageProviderMap.set(`@${selectToken}${user},lastCheckId`, localCheckId + 1);
            } catch (err) {
                console.log(err);
                hasError = true;
            }
        }
        setIsLoading(false);
        !hasError && setStep(5);
    };

    const handlePreviousStep = async () => {
        const toStep = step - 1;
        if (toStep === -1) {
            return;
        }
        if (toStep === 2) {
            setSignDataList([]);
        }
        setStep(toStep);
    };

    const handleNextStep = async () => {
        const toStep = step + 1;
        if (toStep === 5) {
            return;
        } else if (toStep === 1) {
            if (!isMetaMaskConnected) {
                return metaMaskConnect();
            }
        } else if (toStep === 2) {
            const { selectToken } = form.getFieldsValue();
            if (!selectToken) {
                return messageApi.open({
                    type: 'error',
                    content: 'Please select token'
                });
            }
        } else if (toStep === 3) {
            const { inputAmount, selectFriend } = form.getFieldsValue();
            if (!inputAmount || !/^[1-9]\d*$/.test(inputAmount)) {
                return messageApi.open({
                    type: 'error',
                    content: 'Please specify token amount'
                });
            }
            if (!selectFriend) {
                return messageApi.open({
                    type: 'error',
                    content: 'Please input receipients(s)'
                });
            }
            await getUsersOwnerTokenCurrentIdAndSignData();
            return;
        } else if (toStep === 4) {
            return await sendSignData();
        }
        setStep(toStep);
    };

    const selectedToken = form.getFieldValue('selectToken');

    return (
        <>
            <Spin spinning={isLoading}>
                {contextHolder}
                <div className={styles.body}>
                    <div className={styles.steps}>
                        <Steps
                            size="small"
                            current={step}
                            items={[
                                {
                                    title: 'Connect wallet'
                                }, {
                                    title: 'Select token to write Check(s)'
                                }, {
                                    title: 'Input receipient address(es)'
                                }, {
                                    title: 'Send Check(s)'
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
                            style={{ maxWidth: 660 }}
                            autoComplete="off"
                            form={form}
                        >
                            <Form.Item
                                label="Select token to write Check(s)"
                                name="selectToken"
                                hidden={step !== 1}
                            >
                                {
                                    <Select >
                                        {
                                            grantedTokens.map((item: string) => {
                                                return (
                                                    <Select.Option value={item} key={item}>
                                                        {
                                                            item && (
                                                                <ERC20TokenInfo tokenAddress={item}>
                                                                    {
                                                                        (tokeName: string, tokenSymbol: string, formatAddr: string) => {
                                                                            return `${tokeName} (${tokenSymbol}) ${formatAddr}`;
                                                                        }
                                                                    }
                                                                </ERC20TokenInfo>
                                                            )
                                                        }
                                                    </Select.Option>
                                                );
                                            })
                                        }
                                    </Select>
                                }
                            </Form.Item>
                            <Form.Item
                                label={
                                    <div>
                                        Token amount
                                        {
                                            selectedToken && (
                                                <ERC20TokenInfo tokenAddress={selectedToken}>
                                                    {
                                                        (tokeName: string, tokenSymbol: string, formatAddr: string) => {
                                                            return ` (${tokenSymbol})`;
                                                        }
                                                    }
                                                </ERC20TokenInfo>
                                            )
                                        }
                                    </div>
                                }
                                name="inputAmount"
                                hidden={step !== 2}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label="Receipient(s)"
                                name="selectFriend"
                                hidden={step !== 2}
                            >
                                <InputTags onChange={(value: string[]) => { console.log(value); }} />
                            </Form.Item>
                            <Form.Item hidden={step !== 3}>
                                {/* <div className={styles.signData}>signData: {signData}</div> */}
                                <List bordered style={{ width: '500px' }}>
                                    {
                                        userCurrentIds.map((item: any, index: number) => {
                                            return (
                                                <List.Item key={item.user}
                                                    actions={[signDataList[index] ? <CheckOutlined style={{ color: 'green' }} /> : null]}
                                                >
                                                    {item.user}
                                                </List.Item>
                                            );
                                        })
                                    }
                                </List>
                            </Form.Item>
                        </Form>
                        <div className={styles.btnWrapper}>
                            <Space>
                                {
                                    step > 0 && step < 4 ? <Button onClick={handlePreviousStep} >Back</Button> : null
                                }
                                {
                                    step < 4 ? (<Button onClick={handleNextStep} type="primary">{{ 2: 'Write Check(s)', 3: 'Download' }[step] || 'Next'}</Button>) : null
                                }
                            </Space>
                        </div>
                    </div>
                </div>
            </Spin>
        </>
    );
};

export default ERC20Send;
