import { Box, Text } from 'ink';
import inkTextInput from 'ink-text-input';
import get from 'lodash/get.js';
import React, { useCallback, useMemo } from 'react';

// get ink components (not use ESM yet)
const TextInput = inkTextInput.default;

export function PromptInput({ prompt, width, isCurrent, useConfig }) {
  const { config, updateConfig } = useConfig;
  const val = useMemo(() => get(config, prompt.prop) ?? '', [prompt, config]);
  const onChange = useCallback(
    (val) => {
      updateConfig(prompt.prop, val?.trim?.());
    },
    [prompt, updateConfig]
  );

  return (
    <Box flexDirection="row" key={prompt.name}>
      <Box width={width}>
        {isCurrent ? <Text color="blue">&gt; </Text> : <Text>&nbsp;&nbsp;</Text>}
        <Text color={isCurrent ? 'blue' : 'white'}>{prompt.message}</Text>
      </Box>
      <Box>
        {!isCurrent && <Text>{val}</Text>}
        {isCurrent && <TextInput placeholder={prompt.placeholder ?? ''} value={val} onChange={onChange} />}
      </Box>
    </Box>
  );
}
