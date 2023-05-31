import useSWR from 'swr';
import { getErc20Message } from '../../services/account.service';

export const useGetERCMessageUnMint = (account: string) => {
    const key = `@"${account}","ercMessageUnMint"`;
    const { data, error, isLoading } = useSWR(key, async () => {
        return getErc20Message(account);
    }, { revalidateIfStale: true, refreshInterval: 5e3 });

    return { data, isLoading };
};
