import { getDaimoAccountHistory } from '@/app/utils/accountHistory/getDaimoAccountHistory';
import { resolveAccountForAddress } from '@/app/utils/profiles';
import { AddressProfile } from '@/app/utils/types';
import { createViemClient } from '@/app/utils/viem/client';
import { Account, Address, Hex } from 'viem';

// TransferLog type from Daimo API.
// TODO: add type when Daimo API is updated.
type TransferLog = {
  type: string;
  status: string;
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  blockNumber: number;
  blockHash: string;
  txHash: string;
  logIndex: number;
  nonceMetadata: string;
  opHash: string;
  requestStatus: string | null;
  feeAmount: number;
};

export type TransferHistoryEntry = {
  transferLog: TransferLog;
  otherAccountProfile: AddressProfile;
};

/**
 * Handle GET requests to /api/account/[chainId]/[address]
 *
 * @param {Object} params - The request parameters.
 * @param {string} params.chainId - The chain ID of the desired account.
 * @param {string} params.address - The address of the desired account.
 * @returns {Object} The account profile in the form: { account: AccountProfile }.
 */
export async function GET(
  req: Request,
  { params }: { params: { chainId: string; address: string } },
) {
  const publicClient = createViemClient(params.chainId);

  const accountHistory = await getDaimoAccountHistory(params.address as Address);
  const accountProfile: AddressProfile = await resolveAccountForAddress(
    params.address as Hex,
    publicClient,
  );

  // Filter out non-transfer logs.
  const accountTransfers: TransferLog[] = accountHistory
    ? accountHistory.transferLogs.filter((log: TransferLog) => log.type === 'transfer')
    : [];

  // Get other account profile for each transfer.
  const transfers: TransferHistoryEntry[] = await Promise.all(
    accountTransfers.map(async (transferLog) => {
      const otherAccountAddress =
        params.address == transferLog.from ? transferLog.to : transferLog.from;
      const otherAccountProfile: AddressProfile = await resolveAccountForAddress(
        otherAccountAddress as Address,
        publicClient,
      );

      return { transferLog: transferLog, otherAccountProfile: otherAccountProfile };
    }),
  );

  return Response.json({
    accountProfile: accountProfile,
    accountTransferHistory: transfers,
  });
}
