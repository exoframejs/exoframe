import { Box, Text, useFocus } from 'ink';
import inkTextInput from 'ink-text-input';
import get from 'lodash/get.js';
import React, { useCallback, useEffect, useState } from 'react';

// get ink components (not use ESM yet)
const TextInput = inkTextInput.default;

export function PromptArrayInput({ prompt, width, useConfig }) {
  const { isFocused } = useFocus();
  const [inputValue, setInputValue] = useState('');
  const { config, updateConfig } = useConfig;
  const onChange = useCallback(
    (val) => {
      setInputValue(val);
      if (val.length === 0) {
        updateConfig(prompt.prop, undefined);
      }

      const pairs = val.split(',').map((p) => p?.trim());
      // do not update config if current string is invalid
      if (pairs.some((p) => p.trim().length === 0 || !p.includes(':'))) {
        return;
      }
      updateConfig(prompt.prop, pairs);
    },
    [prompt, updateConfig]
  );

  useEffect(() => {
    const vals = get(config, prompt.prop) ?? [];
    setInputValue(vals.join(', '));
  }, [prompt, config]);

  return (
    <Box flexDirection="row" key={prompt.name}>
      <Box width={width}>
        {isFocused ? <Text color="blue">&gt; </Text> : <Text>&nbsp;&nbsp;</Text>}
        <Text color={isFocused ? 'blue' : 'white'}>{prompt.message}</Text>
      </Box>
      <Box>
        {!isFocused && <Text>{inputValue}</Text>}
        {isFocused && <TextInput placeholder={prompt.placeholder ?? ''} value={inputValue} onChange={onChange} />}
      </Box>
    </Box>
  );
}
