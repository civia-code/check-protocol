import { Abi, Contract, ProviderInterface, Call, shortString, number, defaultProvider } from 'starknet';
import { zipWith } from 'lodash-es';
import { Multicall } from '@argent/x-multicall';
import SBTMgrCompiledContractAbi from '../../abi/SBTMgr.json';
import { abi as TestTokenAbi } from '../../abi/TestToken.json';
import { abi as CiviaERC20CheckAbi } from '../../abi/ERC20Check.json';
import axios from 'axios';
import useSWR from 'swr';
const { decodeShortString } = shortString;

const sbtConstractAddress = '0x056041215dda8462b041678717612fd64f99310aaa834a9d42527aeba5f3c661';

export const getFollowingList = async (address: string) => {
    const contract = new Contract(SBTMgrCompiledContractAbi, sbtConstractAddress, defaultProvider);
    const res = await contract.call('get_all_follows', [address]);
    const addressList = res.addrs.map((item: any) => (number.toHex(item)));
    const idList = res.ids.map((item: any) => (item.toNumber()));
    const nickNameList = res.nick_names.map((item: any) => (decodeShortString(item.toString())));
    const resData = zipWith(addressList, idList, nickNameList, (a, b, c) => {
        return {
            address: a,
            id: b,
            nickName: c,
            metamaskAddressList: []
        };
    });
    return resData;
};

export const getSessionToken = async (account: string) => {
    const key = `${account},token`;
    const token = window.localStorage.getItem(key);

    if (token) {
        return token;
    } else {
        const res = await axios.post('/api/getSessionToken', { account });
        window.localStorage.setItem(key, res.headers['session-token'] || '');
        return res;
    }
};

export const getCiviaBinedAddressByAddressList = async (addressList: string[]) => {
    const multicall = new Multicall(defaultProvider);

    const calls: Call[] = addressList.map((address: string) => (
        {
            contractAddress: address,
            entrypoint: 'getAllBindedAddrss',
            calldata: []
        }
    ));
    //
    const res = await Promise.all(
        calls.map((call) => multicall.call(call))
    );

    return res;
};

export const getMetamaskAddressList = async (account: string, civiaAddressList: string[]) => {
    const key = `${account},token`;
    const response = await axios.post('/api/app/getMockBindedAddrs',
        {
            civia_addresses: civiaAddressList
        },
        {
            headers: {
                authorization: `Bearer ${window.localStorage.getItem(key) || ''}`,
                'Content-type': 'application/json;charset=utf-8'
            }
        });
    return Promise.resolve(response.data);
};

export const getSynthesizeAddressList = async (account: string) => {
    const civiaAddressList = await getFollowingList(account).catch((err) => { console.log(err); });
    const getTokenRes = await getSessionToken(account).catch((err) => { console.log(err); });
    // const metamaskAddressList = await getMetamaskAddressList(account, (civiaAddressList || [] as any[]).map((item) => item.address)).then(({ code, result }) => {
    //     if(code === 0){
    //         return result.addressInfos;
    //     }else{
    //         return new Array(civiaAddressList!.length);
    //     }
    // }).catch((err) => {});

    const metamaskAddressList = await getCiviaBinedAddressByAddressList((civiaAddressList || [] as any[]).map((item) => item.address)).then((res: any[]) => {
        return res.map((itme: any) => (
            {
                metamast_addresses: itme.slice(1)
            }
        ));
    });

    const syntheAddressList = zipWith(civiaAddressList as any[], metamaskAddressList, (a, b: any) => {
        return {
            ...a,
            metamaskAddressList: b.metamast_addresses
        };
    });
    return syntheAddressList;
};

export const getUsersOwnerTokenCurrentId = async (account: string, users: string[], tokenAddr: string) => {
    const key = `${account},token`;
    const response = await axios.post('/api/app/getUsersOwnTokenCurrentId',
        {
            account,
            users,
            token_addr: tokenAddr
        },
        {
            headers: {
                authorization: `Bearer ${window.localStorage.getItem(key) || ''}`,
                'Content-type': 'application/json;charset=utf-8'
            }
        });
    return Promise.resolve(response.data);
};

type lme20 = {
    from: string;
    to: string;
    sign: string;
    idBegin: number;
    idEnd: number;
    amount: string;
    token: string;
    sender: string;
    receiver: string;
}

export const leaveMessageERC20 = async (account: string, params: lme20) => {
    const key = `${account},token`;
    const response = await axios.post('/api/app/leaveMessageERC20',
        {
            account,
            from: params.from,
            to: params.to,
            sign: params.sign,
            id_begin: params.idBegin,
            id_end: params.idEnd,
            amount: params.amount,
            token: params.token,
            sender: params.sender,
            receiver: params.receiver
        },
        {
            headers: {
                authorization: `Bearer ${window.localStorage.getItem(key) || ''}`,
                'Content-type': 'application/json;charset=utf-8'
            }
        });
    return Promise.resolve(response.data);
};

export const getTokenInfo = async (address: string) => {
    const contract = new Contract(TestTokenAbi, address, defaultProvider);
    const res = await contract.call('name');
    console.log(res);
    return res;
};

export const getErc20Message = async (account: string) => {
    const getTokenRes = await getSessionToken(account).catch((err) => { console.log(err); });
    const key = `${account},token`;
    const response = await axios.post('/api/app/getUserERC20MessagesUnMint',
        {
            account
        },
        {
            headers: {
                authorization: `Bearer ${window.localStorage.getItem(key) || ''}`,
                'Content-type': 'application/json;charset=utf-8'
            }
        });
    return Promise.resolve(response.data).then((res) => {
        if (res.code === 1) {
            return Promise.resolve(false);
        }
        return Promise.resolve(res.result.messages);
    }).catch((err) => {
        console.log(err);
    });
};

export const userMintERC20Done = async (account: string, messageIds: number[]) => {
    const key = `${account},token`;
    const getTokenRes = await getSessionToken(account).catch((err) => { console.log(err); });
    const response = await axios.post('/api/app/userMintERC20Done',
        {
            account,
            messageIds: messageIds.join(',')
        },
        {
            headers: {
                authorization: `Bearer ${window.localStorage.getItem(key) || ''}`,
                'Content-type': 'application/json;charset=utf-8'
            }
        });
    return Promise.resolve(response.data);
};

export const leaveMessagePackERC20 = async (account: string, messageIds: string[]) => {
    const getTokenRes = await getSessionToken(account).catch((err) => { console.log(err); });
    const key = `${account},token`;
    const response = await axios.post('/api/app/leaveMessagePackERC20',
        {
            account,
            messageIds: messageIds.join(',')
        },
        {
            headers: {
                authorization: `Bearer ${window.localStorage.getItem(key) || ''}`,
                'Content-type': 'application/json;charset=utf-8'
            }
        });
    return Promise.resolve(response.data);
};

export const getUserERC20MessagesUnPacked = async (account: string) => {
    const getTokenRes = await getSessionToken(account).catch((err) => { console.log(err); });
    const key = `${account},unpack`;
    console.log('request2----');
    const response = await axios.post('/api/app/getUserERC20MessagesUnPacked',
        {
            account
        },
        {
            headers: {
                authorization: `Bearer ${window.localStorage.getItem(key) || ''}`,
                'Content-type': 'application/json;charset=utf-8'
            }
        });
    return Promise.resolve(response.data);
};

type lmep20 = {
    from: string;
    to: string;
    sign: string;
    idBegin: number;
    idEnd: number;
    amount: string;
    token: string;
    sender: string;
    receiver: string;
    packMsgId: number;
    messageIds: string;
}
export const leaveMessageERC20PackDone = async (account: string, params: lmep20) => {
    console.log(params);
    const getTokenRes = await getSessionToken(account).catch((err) => { console.log(err); });
    const key = `${account},token`;
    const response = await axios.post('/api/app/leaveMessageERC20PackDone',
        {
            account,
            from: params.from,
            to: params.to,
            sign: params.sign,
            id_begin: params.idBegin,
            id_end: params.idEnd,
            amount: params.amount,
            token: params.token,
            sender: params.sender,
            receiver: params.receiver,
            pack_msg_id: params.packMsgId,
            message_ids: params.messageIds
        },
        {
            headers: {
                authorization: `Bearer ${window.localStorage.getItem(key) || ''}`,
                'Content-type': 'application/json;charset=utf-8'
            }
        });
    return Promise.resolve(response.data);
};
