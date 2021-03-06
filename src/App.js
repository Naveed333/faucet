import detectEthereumProvider from '@metamask/detect-provider';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import Web3 from 'web3';
import { loadContract } from './utils/load-contracts';

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    web3: null,
    contract: null,
  });
  const [balance, setBalance] = useState(null);
  const [account, setAccount] = useState(null);
  const [shouldReload, reload] = useState(false);

  const reloadEffect = useCallback(() => reload(!shouldReload), [shouldReload]);
  const setAccountListener = (provider) => {
    provider.on('accountsChanged', (_) => window.location.reload());

    // provider.jsonRpcConnection.events.on('notification', (payload) => {
    //   const { method } = payload;

    //   if (method === 'metamask_unlockStateChanged') {
    //     setAccount(null);
    //   }
    // });
  };
  useEffect(() => {
    const loadProvider = async () => {
      let provider = await detectEthereumProvider();
      const contract = await loadContract('Faucet', provider);
      if (provider) {
        setAccountListener(provider);
        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract,
        });
      } else {
        console.log('Please, install metamask.');
      }
    };
    loadProvider();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api;
      const balance = await web3.eth.getBalance(contract.address);
      setBalance(web3.utils.fromWei(balance, 'ether'));
    };
    web3Api.contract && loadBalance();
  }, [web3Api, shouldReload]);

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
    };
    web3Api.web3 && getAccount();
  }, [web3Api.web3]);

  // Call from smart contract
  const addFunds = useCallback(async () => {
    const { contract, web3 } = web3Api;
    await contract.addFunds({
      from: account,
      value: web3.utils.toWei('1', 'ether'),
    });
    reloadEffect();
  }, [web3Api, account, reloadEffect]);

  // Call from smart contract
  const withdraw = async () => {
    const { contract, web3 } = web3Api;
    const withdrawAmount = web3.utils.toWei('0.1', 'ether');
    await contract.withdraw(withdrawAmount, {
      from: account,
    });
    reloadEffect();
  };

  return (
    <>
      <div className='faucet-wrapper'>
        <div className='faucet'>
          <div className='is-flex is-align-items-center'>
            <span>
              <strong className='mr-2'>Account: </strong>
            </span>
            {account ? (
              <div>{account}</div>
            ) : (
              <button className='button is-small' onClick={() => web3Api.provider.request({ method: 'eth_requestAccounts' })}>
                Connect Wallet
              </button>
            )}
          </div>
          <div className='balance-view is-size-2 my-4'>
            Current Balance: <strong>{balance}</strong> ETH
          </div>
          <button className='button is-link mr-2' disabled={!account} onClick={addFunds}>
            Donate 1eth
          </button>
          <button className='button is-primary' disabled={!account} onClick={withdraw}>
            Withdraw
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
