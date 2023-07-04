import { Card, CardContent, CardMedia, Grid, Link, Skeleton, SxProps, Theme, Typography } from "@mui/material";
import { Mint } from "../../models/WebClient";
import LazyCis2Metadata from "./LazyCis2Metadata";
const cardMediaSx: SxProps<Theme> = { maxHeight: "200px" };

function Cis2TokenDisplay(props: { token: Mint }) {
  const { token } = props;

  return (
    <Card variant="outlined">
      <LazyCis2Metadata
        metadataUrl={{ url: token.metadata_url.url, hash: "" }}
        loadedTemplate={(metadata) => (
          <CardMedia component="img" image={metadata.display?.url} alt="NFT" sx={cardMediaSx} />
        )}
        loadingTemplate={() => (
          <Skeleton sx={{ ...cardMediaSx, height: "200px" }} animation="wave" variant="rectangular" />
        )}
        errorLoadingTemplate={(error) => <Typography>{error}</Typography>}
      />
      <CardContent>
        <Typography>Token Id: {token.token_id}</Typography>
        <Typography variant="caption" component="div">
          Maturity Time: {token.maturity_time}
        </Typography>
        <Link href={props.token.metadata_url.url} variant="caption" target="_blank">
          Metadata Url
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Cis2TokensDisplay(props: { tokens: Mint[] }) {
  const { tokens } = props;

  return (
    <Grid container spacing={2}>
      {tokens.map((token) => (
        <Grid item xs={4} key={token.token_id}>
          <Cis2TokenDisplay token={token} />
        </Grid>
      ))}
    </Grid>
  );
}
