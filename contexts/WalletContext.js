// WalletContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [connectedAddress, setConnectedAddress] = useState('');

  useEffect(() => {
    const storedAddress = sessionStorage.getItem('connectedAddress');
    if (storedAddress) {
      setConnectedAddress(storedAddress);
    }

    const handleAccountsChanged = (accounts) => {
      setConnectedAddress(accounts[0] || '');
      sessionStorage.setItem('connectedAddress', accounts[0] || '');
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.off('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Forget the wallet in the app, and ask the wallet to drop this site's access so the
  // next connect prompts again. Not every wallet supports revoking, so failures are ignored.
  const disconnectWallet = async () => {
    setConnectedAddress('');
    sessionStorage.removeItem('connectedAddress');
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {  }
    }
  };

  const value = {
    connectedAddress,
    setConnectedAddress,
    disconnectWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}