import { html } from 'htm/react';
import { Text } from 'ink';
import { useEffect, useState } from 'react';

export const Counter = () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((previousCounter) => previousCounter + 1);
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return html`<${Text} color="green">${counter} tests passed</${Text}>`;
};
