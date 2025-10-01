import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import {
  chainIdToName,
  GetScannerResultParams,
  IncomingWebSocketMessage,
  OutgoingWebSocketMessage,
  PairStatsMsgData,
  ScannerApiResponse,
  ScannerResult,
  TickEventPayload,
  TokenData,
} from '../types/test-task-types'
import { InfiniteTable } from './InfiniteTable'
const PAGE_SIZE = 100

export function ReactScanner() {
  const [scanData, setScanData] = useState<TokenData[]>()
  const [scanCurrentPage, setScanCurrentPage] = useState<number>(1)
  const [isConnected, setConnected] = useState(false)
  const [pageCount, setPageCount] = useState(1)
  const tokenAddressMap = useRef<Record<string, TokenData>>({}) // ->token Address : ScannerResult object

  const extractToken = (result: ScannerResult, index: number): TokenData => {
    const {
      token1Name,
      token1Address,
      token1Symbol,
      pairAddress,
      chainId,
      routerAddress,
      price,
      volume,

      currentMcap,
      initialMcap,
      pairMcapUsd,
      pairMcapUsdInitial,
      token1TotalSupplyFormatted,
      token1Decimals,

      diff1H,
      diff24H,
      diff5M,
      diff6H,

      buys,
      sells,

      isMintAuthDisabled,
      isFreezeAuthDisabled,
      honeyPot,
      contractVerified,

      age,
      liquidity,
      percentChangeInLiquidity,

      dexPaid,
    } = result
    let mcap = parseFloat(currentMcap)
    if (mcap < 0) mcap = parseFloat(initialMcap)
    if (mcap < 0) mcap = parseFloat(pairMcapUsd)
    if (mcap < 0) mcap = parseFloat(pairMcapUsdInitial)
    if (mcap < 0) mcap = parseFloat(token1TotalSupplyFormatted)
    if (mcap < 0) mcap = parseFloat(token1Decimals)
    if (mcap < 0) mcap = parseFloat(price)

    const id = (scanCurrentPage - 1) * 100 + index + 1
    return {
      id: `#${id}`,
      tokenName: token1Name,
      tokenAddress: token1Address,
      tokenSymbol: token1Symbol,
      pairAddress,
      chain: chainIdToName(chainId),
      exchange: routerAddress,
      priceUsd: parseFloat(price),
      volumeUsd: parseFloat(volume),
      mcap,
      priceChangePcs: {
        '1h': parseFloat(diff1H),
        '24h': parseFloat(diff24H),
        '5m': parseFloat(diff5M),
        '6h': parseFloat(diff6H),
      },
      transactions: {
        buys: buys || 0,
        sells: sells || 0,
      },
      audit: {
        mintable: !isMintAuthDisabled,
        contractVerified,
        freezable: !isFreezeAuthDisabled,
        honeypot: !!honeyPot,
      },
      tokenCreatedTimestamp: new Date(age),
      liquidity: {
        changePc: parseFloat(percentChangeInLiquidity),
        current: parseFloat(liquidity),
      },
      dexPaid,
      migrationPc: 0,
      totalSupply: parseFloat(token1TotalSupplyFormatted),
    }
  }

  const params: GetScannerResultParams = { page: scanCurrentPage }
  const toTokenData = (data: ScannerResult[]): TokenData[] => {
    const tokens: TokenData[] = []
    data.forEach((p, index) => tokens.push(extractToken(p, index)))
    return tokens
  }

  useEffect(() => {
    if (!isConnected) return
    setScanData(undefined)
    axios
      .get<ScannerApiResponse>('https://api-rs.dexcelerate.com/scanner', {
        params,
      })
      .then((response) => {
        setPageCount(Math.ceil(response.data.totalRows / PAGE_SIZE))
        const tokens = toTokenData(response.data.pairs)
        setScanData(tokens)
        subscribe(tokens)
      })
      .catch((error) => console.error(error))
    return () => unsubscribe(scanData)
  }, [scanCurrentPage, isConnected])

  const sendMessage = (message: OutgoingWebSocketMessage) => {
    if (!ws.current) return false
    if (ws.current.readyState != WebSocket.OPEN) return false
    ws.current.send(JSON.stringify(message))
  }
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    ws.current = new WebSocket('wss://api-rs.dexcelerate.com/ws')
    const wsCurrent = ws.current
    wsCurrent.onopen = () => {
      console.log('opened')
      setConnected(true)
    }
    wsCurrent.onclose = () => {
      console.log('ws closed')
      setConnected(false)
    }
    wsCurrent.onmessage = (e) => {
      const message = JSON.parse(e.data) as IncomingWebSocketMessage
      if (message.event == 'tick') {
        const data = message.data as TickEventPayload
        const latestSwap = data.swaps.filter((swap) => !swap.isOutlier).pop()
        const token = tokenAddressMap.current[data.pair.token]
        if (!token) return
        if (latestSwap) {
          const newPrice = parseFloat(latestSwap.priceToken1Usd)
          const newMarketCap = token.totalSupply * newPrice
          token.priceUsd = newPrice
          token.mcap = newMarketCap
        }
      } else if (message.event == 'pair-stats') {
        const data = message.data as PairStatsMsgData
        const token = tokenAddressMap.current[data.pair.token1Address]
        if (!token) return
        token.audit.mintable = data.pair.mintAuthorityRenounced
        token.audit.freezable = data.pair.freezeAuthorityRenounced
        token.audit.honeypot = !!data.pair.token1IsHoneypot
        token.audit.contractVerified = data.pair.isVerified
        token.linkDiscord = data.pair.linkDiscord
        token.linkTelegram = data.pair.linkTelegram
        token.linkTwitter = data.pair.linkTwitter
        token.linkWebsite = data.pair.linkWebsite
        token.dexPaid = data.pair.dexPaid
        token.migrationPc = Number(data.migrationProgress)
      } else if (message.event == 'scanner-pairs') {
        unsubscribe(scanData)
        const tokens = toTokenData(message.data.results.pairs)
        setScanData(tokens)
        subscribe(tokens)
      } else {
        console.log(message)
      }
    }
    return () => {
      wsCurrent.close()
    }
  }, [])

  const unsubscribe = (result: TokenData[] | undefined) => {
    if (!isConnected || !result) return
    sendMessage({ event: 'unsubscribe-scanner-filter', data: params })
    for (const token of result) {
      const tokenData = {
        chain: token.chain,
        pair: token.pairAddress,
        token: token.tokenAddress,
      }
      sendMessage({
        event: 'unsubscribe-pair',
        data: tokenData,
      })
      sendMessage({
        event: 'unsubscribe-pair-stats',
        data: tokenData,
      })
    }
  }

  const subscribe = (result: TokenData[] | undefined) => {
    if (!isConnected || !result) return
    sendMessage({ event: 'scanner-filter', data: params })
    tokenAddressMap.current = {}
    for (const token of result) {
      const tokenData = {
        chain: token.chain,
        pair: token.pairAddress,
        token: token.tokenAddress,
      }
      tokenAddressMap.current[token.tokenAddress] = token
      sendMessage({
        event: 'subscribe-pair',
        data: tokenData,
      })
      sendMessage({
        event: 'subscribe-pair-stats',
        data: tokenData,
      })
    }
  }

  if (!scanData) return <div>Loading...</div>

  return (
    <div className="flex h-full w-full justify-between">
      <div className="flex flex-col w-full h-full">
        <InfiniteTable data={scanData} />
        <div>
          Page:
          <select
            onChange={(e) => setScanCurrentPage(parseInt(e.target.value))}
          >
            {Array.from({ length: pageCount }, (v, i) => i).map((_, index) => (
              <option selected={index == scanCurrentPage - 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
