import '@/styles/globals.css';
import { WalletProvider } from '../contexts/WalletContext';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Head>
        <link rel="icon" href="/vphree24.png" />
      </Head>
      <div>
        <script src="https://claims.manifoldxyz.dev/1.9.4/claimComplete.umd.min.js" async></script>
        <link rel="stylesheet" href="https://claims.manifoldxyz.dev/1.9.4/claimComplete.css"/> 
        <script src="https://connect.manifoldxyz.dev/3.2.1/connect.umd.min.js" async></script>
        <link rel="stylesheet" href="https://connect.manifoldxyz.dev/3.2.1/connect.css"/>    
      </div>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
