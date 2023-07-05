import React, { FormEvent, useState } from 'react';

import {
    Button, Card, CardActions, CardContent, CardMedia, SxProps, TextField, Theme, Typography
} from '@mui/material';

import DisplayError from '../../ui/DisplayError';

const cardMediaSx: SxProps<Theme> = { maxHeight: "200px" };

export default function GetMaturityTimeCardStep(props: {
  imageUrl?: string;
  tokenId: string;
  onDone: (data: { tokenId: string; maturityTime: Date }) => void;
}) {
  const [state, setState] = useState({
    tokenId: props.tokenId.toString(),
    error: "",
    imageUrl: props.imageUrl,
    quantity: "",
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const time = formData.get("maturityTime")?.toString() || "";

    if (!time) {
      setState({ ...state, error: "Invalid Time" });
      return;
    }

    setState({ ...state, quantity: time, error: "" });
    props.onDone({ tokenId: props.tokenId, maturityTime: new Date(time) });
  }

  return (
    <Card variant="outlined">
      <CardMedia component="img" image={state.imageUrl} alt="NFT" sx={cardMediaSx} />
      <form noValidate autoComplete="off" onSubmit={(e) => submit(e)}>
        <CardContent>
          <Typography gutterBottom component="div">
            Set Maturity Time
          </Typography>
          <TextField
            defaultValue={0}
            name="maturityTime"
            id="maturityTime"
            label="Maturity Time"
            variant="outlined"
            size="small"
            fullWidth={true}
            required={true}
            type="datetime-local"
          />
          <DisplayError error={state.error} />
        </CardContent>
        <CardActions>
          <Button size="small" color="primary" type="submit">
            Set Maturity Time
          </Button>
        </CardActions>
      </form>
    </Card>
  );
}
