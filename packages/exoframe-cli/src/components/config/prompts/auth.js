import md5 from 'apache-md5';
import { Box, Text, useFocus, useInput } from 'ink';
import inkSelectInput from 'ink-select-input-horizontal';
import inkTextInput from 'ink-text-input';
import get from 'lodash/get.js';
import React, { useMemo, useState } from 'react';

// get ink components (not use ESM yet)
const SelectInput = inkSelectInput.default;
const TextInput = inkTextInput.UncontrolledTextInput;

export function PromptAuthInput({ prompt, width, useConfig }) {
  const { isFocused, focus } = useFocus({ id: prompt.name });
  const [editing, setEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState();
  const { config, updateConfig } = useConfig;
  const val = useMemo(() => get(config, prompt.prop) ?? '', [prompt, config]);
  const handleSelect = (val) => {
    setCurrentUser(val.value);
  };
  const handleDelete = () => {
    const users = val.split(',').filter((userString) => {
      const [user] = userString.split(':');
      return user !== currentUser;
    });
    updateConfig(prompt.prop, users.join(','));
  };

  useInput((input, key) => {
    if (!isFocused) {
      return;
    }
    if (input === 'a') {
      setEditing(true);
    }
    if (input === 'd' && !editing) {
      handleDelete();
    }
  });

  const list = useMemo(() => {
    if (!val) {
      return [];
    }
    return val.split(',').map((v) => ({
      label: v.split(':')[0],
      value: v,
    }));
  }, [val]);

  const onNewUser = (value) => {
    const [username, password] = value.split(':');
    let existingUsers = val?.length > 0 ? val.split(',') : [];
    // replace user if it already exists
    if (existingUsers.find((u) => u.includes(username))) {
      existingUsers = existingUsers.filter((userStr) => {
        const [user] = userStr.split(':');
        return user !== username;
      });
    }
    existingUsers.push(`${username}:${md5(password)}`);
    updateConfig(prompt.prop, existingUsers.join(','));
    setEditing(false);
    focus(prompt.name);
  };

  return (
    <Box flexDirection="row" key={prompt.name}>
      <Box width={width}>
        {isFocused ? <Text color="blue">&gt; </Text> : <Text>&nbsp;&nbsp;</Text>}
        <Text color={isFocused ? 'blue' : 'white'}>{prompt.message}</Text>
      </Box>
      <Box flexDirection="column">
        {!isFocused && (
          <Box flexDirection="row">
            {list.map((user) => (
              <Box key={user.value} marginRight={1}>
                <Text>{user.label}</Text>
              </Box>
            ))}
          </Box>
        )}
        {!editing && isFocused && (
          <>
            <SelectInput items={list} onHighlight={handleSelect} />
            <Text>[A]dd / [D]elete</Text>
          </>
        )}
        {editing && isFocused && <TextInput placeholder={prompt.placeholder ?? ''} onSubmit={onNewUser} />}
      </Box>
    </Box>
  );
}
