import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import md5 from 'md5';
import { keyBy, mapValues, max, random, range } from 'lodash';
import { generate } from 'random-words';

import logo from './logo.svg';
import './App.css';

interface IEmailsQueueItem {
  _id: string;
  checkedAt: Date;
  email: string;
  isValid: boolean;
};

function App(): JSX.Element {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [emailsInput, setEmailsInput] = useState<string>('');
  const [emailsQueue, setEmailsQueue] = useState<IEmailsQueueItem[]>([]);
  const [fetchTimeout, setFetchTimeout] = useState<Number>();
  const [maxCheckedAt, setMaxCheckedAt] = useState<number>();

  const onChangeEmailsInput = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setEmailsInput(evt.target.value);
  }, []);

  const onFillRandomly = useCallback(() => {
    const arr: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const str: string = md5(`${i}${Math.random()}`);
      arr.push(`${str.substring(0, random(4, 20))}@${generate()}.test`);
    }
    setEmailsInput(arr.join('\n'));
  }, []);

  const onFillSequence = useCallback(() => {
    const prefix: string = generate() as string;
    setEmailsInput(range(1000, 2000).map((i: number) => `${prefix}${i}@domain.test`).join('\n'));
  }, []);

  const onValidateList = useCallback(() => {
    setIsSending(true);
  }, []);

  useEffect(() => {
    setFetchTimeout(new Number(0)); // eslint-disable-line no-new-wrappers
  }, []);

  useEffect(() => {
    const timeout = (typeof fetchTimeout === 'undefined')
      ? undefined
      : setTimeout(() => {
        fetch(`http://localhost:3001/api/v1/emails/validator${maxCheckedAt ? `?tsFrom=${maxCheckedAt}` : ''}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(async (res) => {
            const json: IEmailsQueueItem[] = await res.json();
            if (!maxCheckedAt) {
              setEmailsQueue(json);
            } else {
              const diff: {[key: string]: IEmailsQueueItem} = mapValues(keyBy(json, '_id'));
              const updatedEmailsQueue: IEmailsQueueItem[] = emailsQueue.map((i: IEmailsQueueItem) => {
                if (diff[i._id]) {
                  i.isValid = diff[i._id].isValid;
                  i.checkedAt = diff[i._id].checkedAt;
                }
                delete diff[i._id];
                return i;
              });
              Object.values(diff).forEach((i: IEmailsQueueItem): void => {
                updatedEmailsQueue.push(i);
              });
              setEmailsQueue(updatedEmailsQueue);
            }
            setFetchTimeout(new Number(5 * 1000)); // eslint-disable-line no-new-wrappers
            setMaxCheckedAt(max(json
              .filter((i: IEmailsQueueItem): boolean => !!i.checkedAt)
              .map((i: IEmailsQueueItem): Date => new Date(i.checkedAt))
            )?.getTime());
          })
          .catch((err) => {
            alert('Oops! Data was not loaded. Retrying, please wait...');
            setFetchTimeout(new Number(15 * 1000)); // eslint-disable-line no-new-wrappers
          });
      }, fetchTimeout.valueOf());
    return () => {
      clearTimeout(timeout);
    };
  }, [fetchTimeout]);

  useEffect(() => {
    if (isSending) {
      fetch('http://localhost:3001/api/v1/emails/validator', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: emailsInput
            .replaceAll(',', '\n')
            .split('\n')
            .map((i: string) => i.trim())
            .filter((i: string) => i.match(/.*@.*/g))
        }),
      })
        .then(async (res) => {
          setEmailsInput('');
          setIsSending(false);
          setFetchTimeout(new Number(0)); // eslint-disable-line no-new-wrappers
        })
        .catch((err) => {
          alert('Oops! Shh... Unexpected things happen. Try again later...');
          setIsSending(false);
        });
    }
  }, [
    isSending,
    emailsInput,
  ]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Box className="App-textarea">
          <TextField
            multiline
            rows={3}
            variant="outlined"
            label="Comma-separated OR one-per-line list of E-mails"
            value={emailsInput}
            disabled={isSending}
            onChange={onChangeEmailsInput}
          />
          <Box sx={{ '& button': { m: 0.2 } }} className="App-textarea-buttons">
            <Button
              variant="outlined"
              size="small"
              onClick={onFillRandomly}
            >
              Fill randomly 1K
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={onFillSequence}
            >
              Fill sequence 1K
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={!emailsInput || isSending}
              onClick={onValidateList}
            >
              Validate list
            </Button>
          </Box>
        </Box>
      </header>
      <main className="App-content">
        {emailsQueue.length > 0 && (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow style={{ backgroundColor: '#61DAFB' }}>
                  <TableCell style={{ fontWeight: 'bold' }}>
                    E-mail
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold' }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emailsQueue.map((row: IEmailsQueueItem, ind: number) => (
                  <TableRow
                    key={ind}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.email}
                    </TableCell>
                    <TableCell align="right">
                      {row.isValid === null && (
                        <Chip
                          color="warning"
                          size="small"
                          variant="outlined"
                          label="Checking..."
                        />
                      )}
                      {row.isValid === true && (
                        <Chip
                          color="success"
                          size="small"
                          label="Valid"
                        />
                      )}
                      {row.isValid === false && (
                        <Chip
                          color="error"
                          size="small"
                          label="Non-valid"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </main>
    </div>
  );
}

export default App;
