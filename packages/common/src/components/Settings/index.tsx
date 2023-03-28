import React, {useCallback, useState} from 'react';
import { Button, Select } from 'antd';
import { ENDPOINTS, useConnectionConfig, useWallet, useWalletModal } from '../../contexts';
import { notify, shortenAddress, useLocalStorageState } from '../../utils';
import { CopyOutlined } from '@ant-design/icons';
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";

export const Settings = ({
  additionalSettings,
}: {
  additionalSettings?: JSX.Element;
}) => {
  const { adapter, connected, disconnect, publicKey } = useWallet();
  const { endpoint, setEndpoint } = useConnectionConfig();
  const { setVisible } = useWalletModal();
  const open = useCallback(() => setVisible(true), [setVisible]);

  const [walletName, setWalletName] = useLocalStorageState(
    'walletName',
  );

  return (
    <React.StrictMode>
      <div style={{ display: 'grid' }}>
        Network:{' '}
        <Select
          onSelect={setEndpoint}
          value={endpoint}
          style={{ marginBottom: 20 }}
        >
          {ENDPOINTS.map(({ name, endpoint }) => (
            <Select.Option value={endpoint} key={endpoint}>
              {name}
            </Select.Option>
          ))}
        </Select>
        {connected && (
          <>
            <span>Wallet:</span>
            {publicKey && (
              <Button
                style={{ marginBottom: 5 }}
                onClick={async () => {
                  if (publicKey) {
                    await navigator.clipboard.writeText(publicKey.toBase58());
                    notify({
                      message: 'Wallet update',
                      description: 'Address copied to clipboard',
                    });
                  }
                }}
              >
                <CopyOutlined />
                {shortenAddress(publicKey.toBase58())}
              </Button>
            )}

            <Button onClick={open} style={{ marginBottom: 5 }}>
              Change
            </Button>
            <Button
              type="primary"
              onClick={
                () => {
                  setWalletName(null)
                  disconnect().catch()
                  return (adapter as SignerWalletAdapter)?.disconnect().catch()
                }
              }
              style={{ marginBottom: 5 }}
            >
              Disconnect
            </Button>
          </>
        )}
        {additionalSettings}
      </div>
    </React.StrictMode>
  );
};
