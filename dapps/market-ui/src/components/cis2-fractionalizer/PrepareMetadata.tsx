import { useState } from 'react';
import { useEffectOnce } from 'usehooks-ts';

import { CIS2Contract } from '@concordium/web-sdk';

import { Metadata } from '../../models/ProjectNFTClient';
import { getDefaultAttributes } from '../../models/ProjectFractionalizerClient';
import { fetchJson } from '../../models/Utils';
import Cis2TokenMetadataForm from '../cis2/Cis2TokenMetadataForm';
import Alert from '../ui/Alert';

export default function PrepareMetadata(props: {
  cis2Contract: CIS2Contract;
  cis2TokenId: string;
  onMetadataPrepared: (metadata: Metadata) => void;
}) {
  const { cis2Contract, cis2TokenId, onMetadataPrepared } = props;
  const [cis2TokenMetadata, setCis2TokenMetadata] = useState<Metadata>({});
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [state, setState] = useState({
    isProcessing: false,
    error: "",
  });

  const mergeMetadata = (defaultMetadata: Metadata, metadata: Metadata): Metadata => {
    return {
      ...metadata,
      attributes: metadata.attributes || defaultMetadata.attributes,
      name: metadata.name || defaultMetadata.name,
      description: metadata.description || defaultMetadata.description,
      display: metadata.display || defaultMetadata.display,
      unique: false,
      artifact: metadata.artifact || defaultMetadata.artifact,
    };
  };

  useEffectOnce(() => {
    setIsLoadingMetadata(true);
    cis2Contract
      .tokenMetadata(cis2TokenId)
      .then((m) => fetchJson<Metadata>(m.url))
      .then((metadata) => {
        const mergedMetadata = mergeMetadata({ attributes: getDefaultAttributes(metadata.attributes) }, metadata);
        setCis2TokenMetadata(mergedMetadata);
        setIsLoadingMetadata(false);
      })
      .catch((e) => {
        console.error(e);
        setState({ ...state, error: e.message });
        setIsLoadingMetadata(false);
      });
  });

  if (isLoadingMetadata) {
    return <Alert severity="info" message={"Loading Metadata"} />;
  }

  return (
    <>
      <Cis2TokenMetadataForm
        defaultFormData={cis2TokenMetadata}
        onSubmit={onMetadataPrepared}
      />
    </>
  );
}
