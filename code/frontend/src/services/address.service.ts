import { encode, number } from 'starknet';

export const formatAddress = (address: string) =>
    encode.addHexPrefix(encode.removeHexPrefix(address).padStart(64, '0'));

export const truncateAddress = (address: string) => {
    return truncateHex(formatAddress(address));
};

export const truncateHex = (value: string) => {
    const hex = value.slice(0, 2);
    const start = value.slice(2, 6);
    const end = value.slice(-4);
    return `${hex}${start}…${end}`;
};

export const getAccountImageUrlByAddress = ({ accountAddress }: { accountAddress?: string } = { accountAddress: '0x0' }) => {
    const id = number.hexToDecimalString(accountAddress || '0').slice(-1);
    return `https://storage.fleek.zone/c33f0f64-9add-4351-ac8c-c869d382d4f8-bucket/civia/nft0${id}.jpg`;
};
