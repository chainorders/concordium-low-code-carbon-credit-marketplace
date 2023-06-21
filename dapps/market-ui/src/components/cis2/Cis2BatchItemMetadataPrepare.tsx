import React, { useState } from 'react';

import { CIS2 } from '@concordium/web-sdk';
import { SxProps } from '@mui/material';
import { Theme } from '@mui/system';

import { Metadata } from '../../models/Cis2Client';
import { PinataClient } from '../../models/PinataClient';
import GetMintCardStep from './metadata-prepare-steps/GetMintCardStep';
import GetQuantityCardStep from './metadata-prepare-steps/GetQuantityCardStep';
import GetTokenIdCardStep from './metadata-prepare-steps/GetTokenIdCardStep';
import UploadArtifactIpfsCardStep from './metadata-prepare-steps/UploadArtifactIpfsCardStep';
import UploadImageIpfsCardStep from './metadata-prepare-steps/UploadImageIpfsCardStep';
import UploadMetadataIpfsCardStep from './metadata-prepare-steps/UploadMetadataIpfsCardStep';

const cardMediaSx: SxProps<Theme> = { maxHeight: "200px" };

enum Steps {
  GetTokenId = 0,
  UploadImage = 1,
  UploadArtifact = 2,
  CreateMetadata = 3,
  GetQuantity = 4,
  Mint = 5,
}

function Cis2BatchItemMetadataPrepare(props: {
  file: File;
  pinataJwtKey: string;
  tokenId: string;
  onDone: (data: { tokenId: string; tokenInfo: [CIS2.MetadataUrl, string] }) => void;
}) {
  const pinata = new PinataClient(props.pinataJwtKey);
  const [artifactUrl, setArtifactUrl] = useState("");
  const [step, setStep] = useState(Steps.GetTokenId);
  const [state, setState] = useState({
    imageDisplayUrl: URL.createObjectURL(props.file),
    tokenId: props.tokenId,
    imageIpfsUrl: "",
    metadataUrl: { url: "", hash: "" } as CIS2.MetadataUrl,
    quantity: "",
  });

  function goForward(skip = 1) {
    setStep(step + skip);
  }

  function tokenIdUpdated(tokenId: string) {
    setState({ ...state, tokenId });
    goForward();
  }

  function imageUploaded(tokenId: string, imageIpfsUrl: string) {
    setState({ ...state, tokenId, imageIpfsUrl });
    goForward();
  }

  function artifactUploaded(tokenId: string, ipfsUrl: string) {
    setArtifactUrl(ipfsUrl);
    goForward();
  }

  function metadataUploaded(tokenId: string, metadataUrl: CIS2.MetadataUrl, metadata: Metadata) {
    if (metadata.unique) {
      // Since Unique is marked in metadata.
      // Quantity step can be skipped.
      const quantity = "1";
      setState({ ...state, tokenId, quantity, metadataUrl });
      goForward(2);
      props.onDone({ tokenId, tokenInfo: [metadataUrl, quantity] });
    } else {
      // Let the user enter quantity.
      setState({ ...state, tokenId, metadataUrl });
      goForward();
    }
  }

  function quantityUpdated(tokenId: string, quantity: string) {
    setState({ ...state, tokenId, quantity });
    goForward();
    props.onDone({ tokenId, tokenInfo: [state.metadataUrl, quantity] });
  }

  switch (step) {
    case Steps.GetTokenId:
      return (
        <GetTokenIdCardStep
          imageUrl={state.imageDisplayUrl}
          tokenId={state.tokenId}
          key={state.tokenId}
          onDone={(data) => tokenIdUpdated(data.tokenId)}
        />
      );
    case Steps.UploadImage:
      return (
        <UploadImageIpfsCardStep
          file={props.file}
          imageUrl={state.imageDisplayUrl}
          pinata={pinata}
          tokenId={state.tokenId}
          key={state.tokenId}
          onDone={(data) => imageUploaded(data.tokenId, data.imageIpfsUrl)}
          sx={cardMediaSx}
        />
      );
    case Steps.UploadArtifact:
      return (
        <UploadArtifactIpfsCardStep
          pinata={pinata}
          tokenId={state.tokenId}
          key={state.tokenId}
          onDone={({ tokenId, ipfsUrl }) => artifactUploaded(tokenId, ipfsUrl)}
          onSkipped={() => goForward()}
          sx={cardMediaSx}
        />
      );
    case Steps.CreateMetadata:
      return (
        <UploadMetadataIpfsCardStep
          pinata={pinata}
          tokenId={state.tokenId}
          imageUrl={state.imageDisplayUrl}
          imageIpfsUrl={state.imageIpfsUrl}
          key={state.tokenId}
          artifactIpfsUrl={artifactUrl}
          onDone={({ tokenId, metadataUrl, metadata }) => metadataUploaded(tokenId, metadataUrl, metadata)}
        />
      );
    case Steps.GetQuantity:
      return (
        <GetQuantityCardStep
          imageUrl={state.imageDisplayUrl}
          tokenId={state.tokenId}
          key={state.tokenId}
          onDone={(data) => quantityUpdated(data.tokenId, data.quantity)}
        />
      );
    case Steps.Mint:
      return (
        <GetMintCardStep
          imageUrl={state.imageDisplayUrl}
          imageIpfsUrl={state.imageIpfsUrl}
          tokenId={state.tokenId}
          metadataUrl={state.metadataUrl}
          quantity={state.quantity}
        />
      );
    default:
      return <></>;
  }
}

export default Cis2BatchItemMetadataPrepare;
