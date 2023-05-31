import { number } from 'starknet';

const getFormatedAddress = (address: string, type: 'starknet'| 'ethereum' = 'starknet') => {
    switch (type) {
    case 'ethereum':
        return number.toHexString(number.hexToDecimalString(address));
    case 'starknet':
    default:
        return number.toHexString(number.hexToDecimalString(address));
    }
};

export {
    getFormatedAddress
};
