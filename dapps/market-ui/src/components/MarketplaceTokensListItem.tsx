import React, { useEffect, useState } from 'react';

import { CIS2Contract, ContractAddress } from '@concordium/web-sdk';
import { Expand, Info, ShoppingCartCheckout } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import {
    Accordion, AccordionDetails, AccordionSummary, Card, CardActions, CardContent, CardMedia, Chip,
    Grid, Tooltip, Typography
} from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { Metadata } from '../models/ProjectNFTClient';
import { TokenListItem } from '../models/CarbonCreditMarketClient';
import { fetchJson } from '../models/Utils';
import { User } from '../types/user';
import Cis2MetadataImageLazy from './cis2/Cis2MetadataImageLazy';

type ListItem = TokenListItem & { cis2Contract: CIS2Contract };

const ActionButton = (props: {
  onBuyClicked: (token: ListItem) => void;
  onReturnClicked: (token: ListItem) => void;
  item: ListItem;
  user: User;
}) => {
  const { user, item } = props;

  const Icon = () => {
    if (item.owner === user.account && item.primaryOwner === user.account) {
      return (
        <>
          <CheckIcon />
          <Tooltip title="You are the primary owner">
            <Info />
          </Tooltip>
        </>
      );
    }

    if (item.owner === user.account) {
      return <CheckIcon />;
    }

    if (item.primaryOwner === user.account) {
      return (
        <>
          <ShoppingCartCheckout />
          <Tooltip title="You are the primary owner">
            <Info />
          </Tooltip>
        </>
      );
    }

    if (user.account) {
      return <ShoppingCartCheckout />;
    }

    return <></>;
  };

  const onClicked = () => {
    if (item.owner === user.account && user.accountType === "wallet") {
      props.onReturnClicked(props.item);
    } else {
      props.onBuyClicked(props.item);
    }
  };

  return (
    <IconButton onClick={onClicked} sx={{ textAlign: "right" }}>
      <Icon />
    </IconButton>
  );
};

/**
 * Displays a single token from the list of all the tokens listed on Marketplace.
 */
function MarketplaceTokensListItem(props: {
  onReturnClicked(item: ListItem): void;
  item: ListItem;
  marketContractAddress: ContractAddress;
  onBuyClicked: (token: ListItem) => void;
  user: User;
}) {
  const { item, user } = props;
  const [metadata, setMetadata] = useState<Metadata>();

  useEffect(() => {
    props.item.cis2Contract
      .tokenMetadata(props.item.tokenId)
      .then((m) => fetchJson<Metadata>(m.url))
      .then(setMetadata)
      .catch((e) => {
        console.error(e);
        setMetadata(undefined);
      });
  }, [props.item.cis2Contract, props.item.tokenId]);

  return (
    <Grid item xs={3} key={item.tokenId + item.contract.index + item.contract.subindex}>
      <Card variant="elevation">
        <CardMedia>
          <Cis2MetadataImageLazy cis2Contract={props.item.cis2Contract} tokenId={item.tokenId} />
        </CardMedia>
        <CardContent>
          <Grid container justifyContent={"space-between"}>
            <Grid item xs={6}>
              <Typography variant="body1" textAlign={"left"} fontSize={"2em"} fontWeight={"bold"}>
                {item.price.toString()}{" "}
                <Typography component={"span"} padding={0} margin={0}>
                  CCD
                </Typography>
              </Typography>
              <Typography textAlign={"left"}>{metadata?.name}</Typography>
              <Typography variant="body2" textAlign={"left"}>
                {metadata?.description}
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign={"right"}>
              <Tooltip title={"Token Id"}>
                <Typography variant="caption" component={"div"} textAlign={"right"}>
                  {item.tokenId.toString()}
                </Typography>
              </Tooltip>
              <Tooltip title={"Contract"}>
                <Typography variant="caption" component={"div"} textAlign={"right"}>
                  {item.contract.index.toString()} / {item.contract.subindex.toString()}
                </Typography>
              </Tooltip>
              <Tooltip title={`Owner: ${item.owner}`}>
                <Typography variant="caption" component={"div"} textAlign={"right"}>
                  {item.owner.slice(0, 5)}...
                </Typography>
              </Tooltip>
              <ActionButton
                user={user}
                item={props.item}
                onBuyClicked={props.onBuyClicked}
                onReturnClicked={props.onReturnClicked}
              />
            </Grid>
            <Grid item xs={12} mt={"1em"}>
              <Accordion variant="outlined">
                <AccordionSummary expandIcon={<Expand />}>
                  <Typography>Attributes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container>
                    {metadata?.attributes?.map((a) => (
                      <Grid item>
                        <Chip label={`${a.name}: ${a.value}`} />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions></CardActions>
      </Card>
    </Grid>
  );
}

export default MarketplaceTokensListItem;
