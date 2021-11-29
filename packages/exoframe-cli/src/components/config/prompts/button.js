import { Box, Text, useApp, useFocus, useInput } from 'ink';
import React from 'react';

export function PromptButton({ prompt, width, useConfig }) {
  const { isFocused } = useFocus();
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.return && isFocused) {
      prompt.action({ ...useConfig, exit });
    }
  });

  return (
    <Box flexDirection="row" key={prompt.name}>
      <Box width={width}>
        {isFocused ? <Text color="blue">&gt; </Text> : <Text>&nbsp;&nbsp;</Text>}
        <Text color={isFocused ? 'blue' : 'white'}>{prompt.message}</Text>
      </Box>
    </Box>
  );
}
