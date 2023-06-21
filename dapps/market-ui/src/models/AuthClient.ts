import { Buffer } from 'buffer/';

import { AccountAddress, sha256 } from '@concordium/web-sdk';

import { BASE_ACCOUNT_ADDRESS } from '../Constants';

/**
 * Converts an email address to an account address.
 * Hashes the email address and takes the first 3 bytes of the hash.
 * Then appends the first 29 bytes of the base account address.
 *
 * @param email Email address of the user.
 * @returns Accoutn address of the user.
 */
export async function getUserCurrent(email: string): Promise<{ account: string }> {
  //TODO: implement Authentification Backend Service
  const emailHash = sha256([Buffer.from(email, "utf-8")]);
  const alias = getAlias(emailHash);
  return Promise.resolve({
    account: alias.address,
  });
}

/**
 * Creates an account alias for the given email address hash.
 *
 * @param emailHash SHA256 hash of the email address.
 * @returns Account alias for the given email address.
 */
function getAlias(emailHash: Buffer): AccountAddress {
  const emailBytes = emailHash.slice(0, 3);
  const accountAddressBytes = new AccountAddress(BASE_ACCOUNT_ADDRESS).decodedAddress.slice(0, 29);
  const aliasBytes = Buffer.concat([accountAddressBytes, emailBytes]);

  return AccountAddress.fromBytes(aliasBytes);
}
