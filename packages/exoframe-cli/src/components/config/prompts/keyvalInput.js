import { Box, Text } from 'ink';
import inkTextInput from 'ink-text-input';
import get from 'lodash/get.js';
import React, { useCallback, useEffect, useState } from 'react';

// get ink components (not use ESM yet)
const TextInput = inkTextInput.default;

export function PromptKeyValInput({ prompt, width, isCurrent, useConfig }) {
  const [inputValue, setInputValue] = useState('');
  const { config, updateConfig } = useConfig;
  const onChange = useCallback(
    (val) => {
      setInputValue(val);
      const pairs = val.split(',');
      // do not update config if current string is invalid
      if (pairs.some((p) => p.trim().length === 0 || !p.includes('='))) {
        return;
      }
      const res = pairs
        .filter((p) => p.length > 3)
        .map((pair) => {
          const s = pair.split('=');
          const [key, val] = s;
          return { [key.trim()]: val.trim() };
        })
        .reduce((acc, cur) => ({ ...acc, ...cur }), {});
      updateConfig(prompt.prop, res);
    },
    [prompt, updateConfig]
  );

  useEffect(() => {
    const vals = Object.keys(get(config, prompt.prop) ?? {}).map((k) => `${k}=${config[prompt.prop][k]}`);
    setInputValue(vals.join(', '));
  }, [prompt, config]);

  return (
    <Box flexDirection="row" key={prompt.name}>
      <Box width={width}>
        {isCurrent ? <Text color="blue">&gt; </Text> : <Text>&nbsp;&nbsp;</Text>}
        <Text color={isCurrent ? 'blue' : 'white'}>{prompt.message}</Text>
      </Box>
      <Box>
        {!isCurrent && <Text>{inputValue}</Text>}
        {isCurrent && <TextInput placeholder={prompt.placeholder ?? ''} value={inputValue} onChange={onChange} />}
      </Box>
    </Box>
  );
}
