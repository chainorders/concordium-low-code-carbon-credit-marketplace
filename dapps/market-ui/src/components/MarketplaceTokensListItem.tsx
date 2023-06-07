import React, { useEffect, useState } from 'react';

import { CIS2Contract, ContractAddress } from '@concordium/web-sdk';
import CheckIcon from '@mui/icons-material/Check';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

import { Metadata } from '../models/Cis2Client';
import { TokenListItem } from '../models/MarketplaceClient';
import { fetchJson } from '../models/Utils';
import Cis2MetadataImageLazy from './cis2/Cis2MetadataImageLazy';

type ListItem = TokenListItem & { cis2Contract: CIS2Contract };

/**
 * Displays a single token from the list of all the tokens listed on Marketplace.
 */
function MarketplaceTokensListItem(props: {
  onReturnClicked(item: ListItem): void;
  item: ListItem;
  marketContractAddress: ContractAddress;
  onBuyClicked: (token: ListItem) => void;
}) {
  const { item } = props;

  const [state, setState] = useState({
    isLoading: true,
    url: "",
    name: "",
    desc: "",
    price: item.price,
    isBought: false,
  });

  useEffect(() => {
    const setStateMetadata = (metadata: Metadata) =>
      setState({
        ...state,
        isLoading: false,
        url: metadata.display?.url || "",
        name: metadata.name || "",
        desc: metadata.description || "",
        price: item.price,
      });

    props.item.cis2Contract
      .tokenMetadata(props.item.tokenId)
      .then((m) => fetchJson<Metadata>(m.url))
      .then((metadata) => {
        setStateMetadata(metadata);
      })
      .catch((e) => {
        console.error(e);
        setStateMetadata({} as Metadata);
      });
  }, [props.item.cis2Contract, props.item.tokenId]);

  return (
    <ImageListItem
      sx={{ display: state.isBought ? "none" : "" }}
      key={item.tokenId + item.contract.index + item.contract.subindex}
    >
      <Cis2MetadataImageLazy cis2Contract={props.item.cis2Contract} tokenId={item.tokenId} />
      <ImageListItemBar
        title={`Price: ${state.price} CCD`}
        position="below"
        subtitle={
          <>
            <Typography variant="caption" component={"div"}>
              {state.name}
            </Typography>
            <Typography variant="caption" component={"div"}>
              {state.desc}
            </Typography>
            <Typography variant="caption" component={"div"}>
              Index : {item.contract.index.toString()} / {item.contract.subindex.toString()}
            </Typography>
            <Typography variant="caption" component={"div"} title={item.owner}>
              Owner : {item.owner.slice(0, 5)}...
            </Typography>
          </>
        }
        actionIcon={
          <IconButton
            sx={{ height: "100%" }}
            aria-label={`buy ${item.tokenId}`}
            onClick={() => props.onBuyClicked(item)}
          >
            {state.isBought ? <CheckIcon /> : <ShoppingCartIcon />}
          </IconButton>
        }
      />
    </ImageListItem>
  );
}

export default MarketplaceTokensListItem;
