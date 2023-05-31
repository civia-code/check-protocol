import { FC, useEffect, useState, useRef } from 'react';
import { Spin, Button, List, message, Card, Empty } from 'antd';
import { useContractRead, useContractWrite, useConnect, useAccount, useSignMessage } from 'wagmi';
import { ethers, BigNumber } from 'ethers';

import { useAddCustomNet, useAddBSCTestNetAndSwitch } from '../../hooks/useAddCustomNet';

import { truncateHex } from '../../services/address.service';

import { ERC20TokenInfo } from '../ERC20TokenInfo';

import { leaveMessageERC20PackDone } from '../../services/account.service';
import { getFormatedAddress } from '../../lib/address';

import { useGetUserERC20MessagesUnPackedCache } from '../../hooks/useGetUserERC20MessageUnPacked';

import styles from './index.module.css';

const TokenItem: FC<any> = ({ item, onSigned }) => {
    return (
        <>
            <List.Item>
                <div><label className={styles.label} />{item.amount}</div>
            </List.Item>
        </>
    );
};
//
const ERC20Pack: FC<any> = () => {
    const locationSearch = new URLSearchParams(location.search);
    const searchCiviaWalletAddress = getFormatedAddress(locationSearch.get('civiaAddress') as string);
    const searchERC20Token = locationSearch.get('erc20token') as string;
    const [isLoading, setIsLoading] = useState(true);
    const [unPackMessageList, setUnPackMessageList] = useState<Map<string, any[]>>(new Map());

    const { chainId, switchBscTestNet } = useAddBSCTestNetAndSwitch();
    //
    const { isConnected: isMetaMaskConnected, address: metamaskAddress } = useAccount();
    const { connect: metaMaskConnect, connectors: metaMaskConnectors, error: ucError, isLoading: ucIsLoading, pendingConnector } = useConnect();
    const connectMetamaskRef = useRef(false);
    const onSignDataFn = useRef<Function>();
    const { data: signData, signMessage: metaMaskSignMessage } = useSignMessage({
        onSuccess: (res) => {
            onSignDataFn.current && onSignDataFn.current(res);
        },
        onError: (err) => {
            console.log(err);
            const errStr = String(err);
            const isDenied = /MetaMask Tx Signature: User denied transaction signature/.test(errStr);
            messageApi.open({
                type: 'error',
                content: isDenied ? 'MetaMask Tx Signature: User denied transaction signature' : errStr
            });
        }
    });

    // auto connect metamask
    if (!connectMetamaskRef.current && !metamaskAddress && metaMaskConnectors && metaMaskConnectors.length) {
        connectMetamaskRef.current = true;
        metaMaskConnect({ connector: metaMaskConnectors[0] });
    }

    const [messageApi, contextHolder] = message.useMessage();

    const { data: unpackMessage = [], isLoading: isUnpackMessageLoading } = useGetUserERC20MessagesUnPackedCache(searchCiviaWalletAddress);
    // console.log(unpackMessage);

    // useEffect(() => {
    //     setIsLoading(isUnpackMessageLoading);
    // }, [isUnpackMessageLoading]);

    useEffect(() => {
        const newMessageList = unpackMessage.reduce((newML: Map<string, any>, item: any, index: number) => {
            const content = JSON.parse(item.content);
            const newMLItem: any[] = [];
            content.packContents.forEach((contentItem: any) => {
                newMLItem.push(contentItem);
            });
            newML.set(item.message_id, {
                ...item,
                messageIds: content.messageIds,
                content: newMLItem.sort((a: any, b: any) => {
                    return a.id_begin > b.id_begin ? 1 : -1;
                })
            });
            return newML;
        }, new Map());
        setUnPackMessageList(newMessageList);
        setIsLoading(false);
    }, [unpackMessage]);

    const handleSign = async (tokenAddress: string) => {
        const unPackMessageItem: any = unPackMessageList.get(tokenAddress);
        console.log(unPackMessageItem);

        const mergedMessageContent = unPackMessageItem.content.reduce((preContent: any, content: any) => {
            const newContent = {
                amount: Number(preContent.amount) + Number(content.amount),
                id_begin: Math.min(preContent.id_begin || content.id_begin, content.id_begin),
                id_end: Math.max(preContent.id_end || content.id_end, content.id_end),
                receiver: content.receiver,
                sender: content.sender,
                sign: null,
                token: content.token
            };
            return newContent;
        }, {
            amount: 0,
            id_begin: 0,
            id_end: 0,
            receiver: null,
            sender: null,
            sign: null,
            token: null
        });
        //
        const { receiver, token, id_begin: idBegin, id_end: idEnd, amount } = mergedMessageContent;
        const orderParts = [
            { value: token, type: 'address' },
            { value: metamaskAddress, type: 'address' },
            { value: receiver, type: 'address' },
            { value: idBegin, type: 'uint256' },
            { value: idEnd, type: 'uint256' },
            { value: ethers.utils.parseUnits(amount.toString(), 18).toString(), type: 'uint256' }
        ];

        const types = orderParts.map(o => o.type);
        const values = orderParts.map(o => o.value);
        const hash = ethers.utils.solidityKeccak256(types, values);
        metaMaskSignMessage({ message: ethers.utils.arrayify(hash) as any });
        //
        onSignDataFn.current = (signData: string) => {
            doLeaveMessageERC20PackDone({ signData, mergedMessageContent, unPackMessageItem });
        };
    };

    const doLeaveMessageERC20PackDone = async ({ signData, mergedMessageContent, unPackMessageItem }: any) => {
        console.log(unPackMessageItem);
        if (signData) {
            const sigHex = signData.substring(2);
            const r = '0x' + sigHex.slice(0, 64);
            const s = '0x' + sigHex.slice(64, 128);
            const v = parseInt(sigHex.slice(128, 130), 16);
            //
            setIsLoading(true);
            leaveMessageERC20PackDone(searchCiviaWalletAddress, {
                from: searchCiviaWalletAddress,
                to: unPackMessageItem.to,
                sign: JSON.stringify({ r, s, v }),
                idBegin: mergedMessageContent.id_begin,
                idEnd: mergedMessageContent.id_end,
                amount: mergedMessageContent.amount,
                token: mergedMessageContent.token,
                sender: mergedMessageContent.sender,
                receiver: mergedMessageContent.receiver,
                packMsgId: unPackMessageItem.message_id,
                messageIds: unPackMessageItem.messageIds
            }).then(() => {
                messageApi.open({
                    type: 'success',
                    content: 'Success'
                });
            }).catch(() => {
                setIsLoading(false);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    };

    const filterMessageList = Array.from(unPackMessageList.values());

    return (
        <>
            <Spin spinning={isLoading}>
                {contextHolder}
                <div className={styles.body}>
                    <List style={{ visibility: filterMessageList.length ? 'initial' : 'hidden' }}>
                        {
                            filterMessageList.map((item: any, index: number) => {
                                return (
                                    <div key={index}>
                                        <Card title={
                                            <>
                                                <div><label className={styles.label}>Receiver:</label><code>{truncateHex(item.content[0].receiver)}</code></div>
                                                <ERC20TokenInfo tokenAddress={item.content[0].token}>
                                                    {
                                                        (tokeName: string, tokenSymbol: string, formatAddr: string) => {
                                                            return <span><label className={styles.label}>Token:</label>{`${tokeName} (${tokenSymbol}) ${formatAddr}`}&nbsp;&nbsp;</span>;
                                                        }
                                                    }
                                                </ERC20TokenInfo>
                                            </>
                                        }
                                        extra={
                                            <Button type="link" onClick={() => { handleSign(item.message_id); }}>Bundle sign</Button>
                                        }
                                        >
                                            <List.Item><label className={styles.label}>Amount:</label></List.Item>
                                            {
                                                item.content.map((subItem: any, subIndex: number) => {
                                                    return (
                                                        <TokenItem item={subItem} key={subIndex} />
                                                    );
                                                })
                                            }
                                        </Card>
                                        <br />
                                    </div>
                                );
                            })
                        }
                    </List>
                    {
                        filterMessageList.length === 0 ? <Empty /> : null
                    }
                </div>
            </Spin>
        </>
    );
};

export default ERC20Pack;
