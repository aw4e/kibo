"use client";

import { WagmiProvider, createConfig, http, useConnect } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import { useEffect } from "react";

const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [injected()],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});

const queryClient = new QueryClient();

function MiniPayAutoConnect() {
  const { connect } = useConnect();
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum?.isMiniPay) {
      connect({ connector: injected() });
    }
  }, [connect]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MiniPayAutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
