import { Box, Text, useApp, useInput } from 'ink';
import React from 'react';

export function PromptButton({ prompt, width, isCurrent, useConfig }) {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.return && isCurrent) {
      prompt.action({ ...useConfig, exit });
    }
  });

  return (
    <Box flexDirection="row" key={prompt.name}>
      <Box width={width}>
        {isCurrent ? <Text color="blue">&gt; </Text> : <Text>&nbsp;&nbsp;</Text>}
        <Text color={isCurrent ? 'blue' : 'white'}>{prompt.message}</Text>
      </Box>
    </Box>
  );
}
