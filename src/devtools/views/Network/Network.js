// @flow

import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../context';
import ButtonIcon from '../ButtonIcon';
import Button from '../Button';

import styles from './Network.css';

function Section(props: {| title: string, children: React$Node |}) {
  return (
    <>
      <div className={styles.SectionTitle}>{props.title}</div>
      <div className={styles.SectionContent}>{props.children}</div>
    </>
  );
}

export default function Network(props: {| +portalContainer: mixed |}) {
  const store = useContext(StoreContext);

  const [, forceUpdate] = useState({});

  useEffect(() => {
    const onMutated = () => {
      forceUpdate({});
    };
    store.addListener('mutated', onMutated);
    return () => {
      store.removeListener('mutated', onMutated);
    };
  }, [store]);

  const [selectedRequestID, setSelectedRequestID] = useState(0);

  const events = store.getEvents();

  const requests = new Map();

  for (const event of events) {
    switch (event.name) {
      case 'execute.start': {
        requests.set(event.transactionID, {
          id: event.transactionID,
          params: event.params,
          variables: event.variables,
          status: 'active',
          responses: [],
          infos: [],
        });
        break;
      }
      case 'execute.complete': {
        const request = requests.get(event.transactionID);
        if (request != null) {
          request.status = 'completed';
        }
        break;
      }
      case 'execute.next': {
        const request = requests.get(event.transactionID);
        if (request != null) {
          request.responses.push(event.response);
        }
        break;
      }
      case 'execute.info': {
        const request = requests.get(event.transactionID);
        if (request != null) {
          request.infos.push(event.info);
        }
        break;
      }
      case 'execute.unsubscribe': {
        const request = requests.get(event.transactionID);
        if (request != null) {
          request.status = 'unsubscribed';
        }
        break;
      }
      case 'execute.error': {
        const request = requests.get(event.transactionID);
        if (request != null) {
          request.status = 'error';
        }
        break;
      }
      case 'queryresource.fetch':
        // ignore
        break;
      default: {
        /*:: (event.name: null); */
        break;
        // ignore unknown events
      }
    }
  }

  const requestRows = Array.from(requests.values(), request => {
    let statusClass;
    switch (request.status) {
      case 'unsubscribed':
        statusClass = styles.StatusUnsubscribed;
        break;
      case 'error':
        statusClass = styles.StatusError;
        break;
      case 'active':
        statusClass = styles.StatusActive;
        break;
      default:
        statusClass = '';
        break;
    }
    return (
      <div
        key={request.id}
        onClick={() => {
          setSelectedRequestID(request.id);
        }}
        className={`${styles.Request} ${
          request.id === selectedRequestID ? styles.SelectedRequest : ''
        } ${statusClass}`}
      >
        {request.params.name} ({request.status})
      </div>
    );
  });

  return (
    <div className={styles.Network}>
      <div className={styles.Toolbar}>
        <Button onClick={store.clearEvents} title="Clear Logs">
          <ButtonIcon type="clear" />
        </Button>
        <div className={styles.Spacer} />
      </div>
      <div className={styles.Content}>
        <div className={styles.Requests}>{requestRows}</div>
        <div className={styles.RequestDetails}>
          <Section title="Status">
            {requests.get(selectedRequestID)?.status || 'null'}
          </Section>
          <Section title="Request">
            {JSON.stringify(requests.get(selectedRequestID)?.params, null, 2) ||
              'null'}
          </Section>
          <Section title="Variables">
            {JSON.stringify(
              requests.get(selectedRequestID)?.variables,
              null,
              2
            ) || 'null'}
          </Section>
          <Section title="Responses">
            {JSON.stringify(
              requests.get(selectedRequestID)?.responses,
              null,
              2
            ) || ''}
          </Section>
          <Section title="Info">
            {JSON.stringify(requests.get(selectedRequestID)?.infos, null, 2) ||
              ''}
          </Section>
        </div>
      </div>
    </div>
  );
}
