import { useState } from 'react';

import { ContractAddress } from '@concordium/web-sdk';
import {
    Button, Container, Divider, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem,
    Pagination, Select, Stack, TextField, Typography
} from '@mui/material';

import {
    FractionalizerCollateralAddedEvent, FractionalizerCollateralRemovedEvent, FractionalizerEvent,
    FractionalizerMintEvent, FractionalizerRetireEvent, FractionalizerTokenMetadataEvent,
    FractionalizerTransferEvent, ModuleEvent
} from '../../models/web/Events';
import { getContractEvents } from '../../models/web/WebClient';
import DisplayError from '../ui/DisplayError';

const eventTypes = ["Mint", "TokenMetadata", "Transfer", "Retire", "CollateralAdded", "CollateralRemoved"];

function MintEvent(props: { event: FractionalizerMintEvent }) {
  const { event } = props;

  return (
    <ListItem alignItems="flex-start">
      <ListItemText
        primary="Mint"
        secondary={
          <>
            <Typography component="div">Token #{event.token_id}</Typography>
            <Typography component="div">Amount {event.amount}</Typography>
            <Typography component="div">By {event.owner.Account?.[0]}</Typography>
          </>
        }
      />
    </ListItem>
  );
}

function TokenMetadataEvent(props: { event: FractionalizerTokenMetadataEvent }) {
  const { event } = props;

  return (
    <ListItem alignItems="flex-start">
      <ListItemText
        primary="Token Metadata"
        secondary={
          <>
            <Typography component="div">Token {event.token_id}</Typography>
            <Typography component="div">Url {event.metadata_url.url}</Typography>
          </>
        }
      />
    </ListItem>
  );
}

function TransferEvent(props: { event: FractionalizerTransferEvent }) {
  const { event } = props;

  return (
    <ListItem alignItems="flex-start">
      <ListItemText
        primary="Transfer"
        secondary={
          <>
            <Typography component="div">Token {event.token_id}</Typography>
            <Typography component="div">Amount {event.amount}</Typography>
            <Typography component="div">By {event.from.Account?.[0]}</Typography>
            <Typography component="div">To {event.to.Account?.[0]}</Typography>
          </>
        }
      />
    </ListItem>
  );
}

function CollateralAddedEvent(props: { event: FractionalizerCollateralAddedEvent }) {
  const { event } = props;

  return (
    <ListItem alignItems="flex-start">
      <ListItemText
        primary="Collateral Added"
        secondary={
          <>
            <Typography component="div">
              Token {event.token_id} ({event.contract.index}/{event.contract.subindex})
            </Typography>
            <Typography component="div">Amount {event.amount}</Typography>
            <Typography component="div">From {event.owner.Account?.[0]}</Typography>
          </>
        }
      />
    </ListItem>
  );
}

function CollateralRemovedEvent(props: { event: FractionalizerCollateralRemovedEvent }) {
  const { event } = props;

  return (
    <ListItem alignItems="flex-start">
      <ListItemText
        primary="Collateral Removed"
        secondary={
          <>
            <Typography component="div">
              Token {event.token_id} ({event.contract.index}/{event.contract.subindex})
            </Typography>
            <Typography component="div">Amount {event.amount}</Typography>
            <Typography component="div">From {event.owner.Account?.[0]}</Typography>
          </>
        }
      />
    </ListItem>
  );
}

function RetireEvent(props: { event: FractionalizerRetireEvent }) {
  const { event } = props;

  return (
    <ListItem alignItems="flex-start">
      <ListItemText
        primary="Retired"
        secondary={
          <>
            <Typography component="div">Token {event.token_id}</Typography>
            <Typography component="div">Amount {event.amount}</Typography>
            <Typography component="div">By {event.owner.Account?.[0]}</Typography>
          </>
        }
      />
    </ListItem>
  );
}

function Event(props: { event: FractionalizerEvent }) {
  const { event } = props;
  const eventType = Object.keys(event)[0];

  switch (eventType) {
    case "Mint":
      return <MintEvent event={event[eventType]!} />;
    case "TokenMetadata":
      return <TokenMetadataEvent event={event[eventType]!} />;
    case "Transfer":
      return <TransferEvent event={event[eventType]!} />;
    case "CollateralAdded":
      return <CollateralAddedEvent event={event[eventType]!} />;
    case "CollateralRemoved":
      return <CollateralRemovedEvent event={event[eventType]!} />;
    case "Retire":
      return <RetireEvent event={event[eventType]!} />;
    default:
      return <div>Unknown event type: {eventType}</div>;
  }
}

export default function FractionalizerEvents({ defaultContractAddress }: { defaultContractAddress: ContractAddress }) {
  const [form, setForm] = useState({
    index: defaultContractAddress.index.toString(),
    subindex: defaultContractAddress.subindex.toString(),
    account: "",
    eventType: "",
  });
  const [state, setState] = useState({
    error: "",
    checking: false,
  });

  const [events, setEvents] = useState<ModuleEvent[]>([]);
  const [pageCount, setPageCount] = useState(0);

  function onFormSubmitted(page = 0): void {
    setState({ ...state, error: "", checking: true });
    getContractEvents(form.index, form.subindex, form.account, form.eventType, page)
      .then((res) => {
        console.log(res);
        setState({ ...state, checking: false, error: "" });
        setEvents(res.events);
        setPageCount(res.pageCount);
      })
      .catch((e: Error) => {
        setState({ ...state, checking: false, error: e.message });
      });
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={2} direction={"row"}>
        <TextField
          id="contract-index"
          name="contractIndex"
          label="Contract Index"
          variant="standard"
          type={"number"}
          disabled={state.checking}
          value={form.index}
          fullWidth
          onChange={(e) => setForm({ ...form, index: e.target.value })}
        />
        <TextField
          id="contract-subindex"
          name="contractSubindex"
          label="Contract Sub Index"
          variant="standard"
          type={"number"}
          disabled={state.checking}
          value={form.subindex}
          fullWidth
          onChange={(e) => setForm({ ...form, subindex: e.target.value })}
        />
        <TextField
          id="account"
          name="account"
          label="Account"
          variant="standard"
          type={"string"}
          disabled={state.checking}
          value={form.account}
          onChange={(e) => setForm({ ...form, account: e.target.value })}
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel id="event-type-label" variant="standard">
            Event Type
          </InputLabel>
          <Select
            variant="standard"
            value={form.eventType}
            onChange={(e) => setForm({ ...form, eventType: e.target.value })}
          >
            {eventTypes.map((eventType) => (
              <MenuItem key={eventType} value={eventType}>
                {eventType}
              </MenuItem>
            ))}
            <MenuItem value="">Any</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" type="button" onClick={() => onFormSubmitted()}>
          Get
        </Button>
      </Stack>
      <DisplayError error={state.error} />
      <Container>
        <List sx={{ width: "100%", bgcolor: "background.paper" }}>
          {events.map((contractEvent) => (
            <>
              <Event event={contractEvent as FractionalizerEvent} />
              <Divider variant="inset" component="li" />
            </>
          ))}
        </List>
        {pageCount > 1 && <Pagination count={pageCount} onChange={(_, v) => onFormSubmitted(v - 1)} />}
      </Container>
    </Stack>
  );
}
