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
  TokenMap,
} from '../types/test-task-types'
import { InfiniteTable } from './InfiniteTable'
const PAGE_SIZE = 100

export function ReactScanner() {
  const [scanData, setScanData] = useState<TokenMap>()
  const [scanCurrentPage, setScanCurrentPage] = useState<number>(1)
  const [isConnected, setConnected] = useState(false)
  const [pageCount, setPageCount] = useState(1)

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

  const toMap = (data: TokenData[]): TokenMap => {
    const map: TokenMap = {}
    for (const tokenData of data) {
      map[tokenData.tokenAddress] = tokenData
    }
    return map
  }

  const loadFromApi = () => {
    unsubscribe(scanData)
    axios
      .get<ScannerApiResponse>('https://api-rs.dexcelerate.com/scanner', {
        params,
      })
      .then((response) => {
        setPageCount(Math.ceil(response.data.totalRows / PAGE_SIZE))
        const tokens = toTokenData(response.data.pairs)
        setScanData(toMap(tokens))
        subscribe(tokens)
      })
      .catch((error) => console.error(error))
  }

  useEffect(() => {
    if (!isConnected) return
    loadFromApi()
  }, [scanCurrentPage])

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
      setConnected(true)
      loadFromApi()
    }

    wsCurrent.onclose = () => {
      setConnected(false)
    }

    wsCurrent.onmessage = (e) => {
      setScanData((scanData) => {
        if (!scanData) return
        const message = JSON.parse(e.data) as IncomingWebSocketMessage
        if (message.event == 'tick') {
          const data = message.data as TickEventPayload
          const tokenKey = data.pair.token
          const token = scanData[tokenKey]
          if (!token) return scanData
          const latestSwap = data.swaps.filter((swap) => !swap.isOutlier).pop()
          if (latestSwap) {
            const newPrice = parseFloat(latestSwap.priceToken1Usd)
            const newMarketCap = token.totalSupply * newPrice
            token.priceUsd = newPrice
            token.mcap = newMarketCap
            return { ...scanData, [tokenKey]: token }
          }
        } else if (message.event == 'pair-stats') {
          const data = message.data as PairStatsMsgData
          const tokenKey = data.pair.token1Address
          const token = scanData[tokenKey]
          if (!token) return scanData
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
          return { ...scanData, [tokenKey]: token }
        } else if (message.event == 'scanner-pairs') {
          unsubscribe(scanData)
          const tokens = toTokenData(message.data.results.pairs)
          subscribe(tokens)
          return toMap(tokens)
        }
        return scanData
      })
    }
    return () => {
      wsCurrent.close()
    }
  }, [])

  const unsubscribe = (result: TokenMap | undefined) => {
    if (!result) return
    sendMessage({ event: 'unsubscribe-scanner-filter', data: params })
    const tokenKeys = Object.keys(result)

    for (const tokenKey of tokenKeys) {
      const token = result[tokenKey]
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
    if (!result) return
    sendMessage({ event: 'scanner-filter', data: params })
    for (const token of result) {
      const tokenData = {
        chain: token.chain,
        pair: token.pairAddress,
        token: token.tokenAddress,
      }
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
      <div className="flex flex-col w-full h-full items-center">
        <InfiniteTable data={Object.values(scanData)} />
        <div className="flex gap-3 p-2">
          <button
            className="border border-1 border-black rounded-md p-1"
            disabled={scanCurrentPage == 1}
            onClick={() => {
              setScanCurrentPage((p) => p - 1)
            }}
          >
            Previous
          </button>
          <span className="flex h-full items-center">
            Page: {scanCurrentPage} from {pageCount}
          </span>
          <button
            className="border border-1 border-black rounded-md p-1"
            disabled={scanCurrentPage == pageCount}
            onClick={() => {
              setScanCurrentPage((p) => p + 1)
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
