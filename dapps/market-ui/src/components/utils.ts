import { ContractAddress } from "@concordium/web-sdk";
import { useParams } from "react-router";

export function useParamsContractAddress(): ContractAddress | undefined {
  const { index, subindex } = useParams();
  if (!index || !subindex) {
    return undefined;
  }

  return {
    index: BigInt(index),
    subindex: BigInt(subindex),
  };
}
