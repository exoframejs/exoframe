import { Box, Text, useFocus } from 'ink';
import inkTextInput from 'ink-text-input';
import get from 'lodash/get.js';
import React, { useCallback, useMemo } from 'react';

// get ink components (not use ESM yet)
const TextInput = inkTextInput.default;

export function PromptInput({ prompt, width, useConfig }) {
  const { isFocused } = useFocus({ id: prompt.name });
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
        {isFocused ? <Text color="blue">&gt; </Text> : <Text>&nbsp;&nbsp;</Text>}
        <Text color={isFocused ? 'blue' : 'white'}>{prompt.message}</Text>
      </Box>
      <Box>
        {!isFocused && <Text>{val}</Text>}
        {isFocused && <TextInput placeholder={prompt.placeholder ?? ''} value={val} onChange={onChange} />}
      </Box>
    </Box>
  );
}
