import React from "react";

import { Typography } from "@mui/material";

function DisplayError(props: { error?: string }) {
  const { error } = props;
  if (!error) {
    return <></>;
  }

  return (
    <Typography variant="body1" color={"error"}>
      {error}
    </Typography>
  );
}

export default DisplayError;
