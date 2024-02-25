import '@/styles/globals.css';
import { WalletProvider } from '../contexts/WalletContext';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Head>
        <link rel="icon" href="/vphree24.png" />
      </Head>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
