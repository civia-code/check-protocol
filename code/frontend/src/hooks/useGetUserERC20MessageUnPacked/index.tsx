import useSWR from 'swr';
import { getUserERC20MessagesUnPacked } from '../../services/account.service';

export const useGetUserERC20MessagesUnPackedCache = (account: string) => {
    const key = `@"${account}","unpackMessage"`;
    const { data, error, isLoading } = useSWR(key, async () => {
        return getUserERC20MessagesUnPacked(account).then(({ code, result }) => {
            console.log(result);
            if (code === 0) {
                return result.messages;
            }
        });
    }, { revalidateIfStale: true, refreshInterval: 5e3 });

    return { data, isLoading };
};
