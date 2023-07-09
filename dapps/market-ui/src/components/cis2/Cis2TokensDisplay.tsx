import { Card, CardContent, CardMedia, Grid, Skeleton, SxProps, Theme, Typography } from "@mui/material";

import LazyCis2Metadata from "./LazyCis2Metadata";
import {
  ProjectNftMaturityTimeEvent,
  ProjectNftMintEvent,
  ProjectNftTokenMetadataEvent,
} from "../../models/web/Events";

const cardMediaSx: SxProps<Theme> = { maxHeight: "200px" };

function Cis2TokenDisplay(props: {
  token: {
    mint: ProjectNftMintEvent;
    tokenMetadata: ProjectNftTokenMetadataEvent;
    maturityTime: ProjectNftMaturityTimeEvent;
  };
}) {
  const {
    token: { mint, tokenMetadata, maturityTime },
  } = props;

  return (
    <Card variant="outlined">
      <LazyCis2Metadata
        metadataUrl={{ url: tokenMetadata.metadata_url.url, hash: "" }}
        loadedTemplate={(metadata) => (
          <CardMedia component="img" image={metadata.display?.url} alt="NFT" sx={cardMediaSx} />
        )}
        loadingTemplate={() => (
          <Skeleton sx={{ ...cardMediaSx, height: "200px" }} animation="wave" variant="rectangular" />
        )}
        errorLoadingTemplate={(error) => <Typography>{error}</Typography>}
      />
      <CardContent>
        <Typography>Token Id: {mint.token_id}</Typography>
        <Typography>Maturity Time: {maturityTime.maturity_time}</Typography>
      </CardContent>
    </Card>
  );
}

export default function Cis2TokensDisplay(props: {
  tokens: {
    mint: ProjectNftMintEvent;
    tokenMetadata: ProjectNftTokenMetadataEvent;
    maturityTime: ProjectNftMaturityTimeEvent;
  }[];
}) {
  const { tokens } = props;

  return (
    <Grid container spacing={2}>
      {tokens.map((token) => (
        <Grid item xs={4} key={token.mint.token_id}>
          <Cis2TokenDisplay token={token} />
        </Grid>
      ))}
    </Grid>
  );
}
