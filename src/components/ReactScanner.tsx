import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import {
  chainIdToName,
  GetScannerResultParams,
  OutgoingWebSocketMessage,
  ScannerApiResponse,
} from '../types/test-task-types'
import { InfiniteTable } from './InfiniteTable'
const PAGE_SIZE = 100

export function ReactScanner() {
  const params: GetScannerResultParams = {}
  const [scanData, setScanData] = useState<ScannerApiResponse>()
  const [scanCurrentPage, setScanCurrentPage] = useState<number>(1)
  const [isConnected, setConnected] = useState(false)

  useEffect(() => {
    setScanData(undefined)
    axios
      .get('https://api-rs.dexcelerate.com/scanner', {
        params,
      })
      .then((response) => {
        setScanData(response.data)
      })
      .catch((error) => console.error(error))
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
      console.log('opened')
      setConnected(true)
    }
    wsCurrent.onclose = () => {
      console.log('ws closed')
      setConnected(false)
    }
    wsCurrent.onmessage = (e) => {
      const message = JSON.parse(e.data)
      console.log('e', message)
    }
    return () => {
      wsCurrent.close()
    }
  }, [])

  useEffect(() => {
    if (!isConnected || !scanData?.pairs) return
    const wsCurrent = ws.current
    sendMessage({ event: 'scanner-filter', data: params })
    for (const token of scanData.pairs) {
      const tokenData = {
        chain: chainIdToName(token.chainId),
        pair: token.pairAddress,
        token: token.token1Address,
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

    return () => {
      sendMessage({ event: 'unsubscribe-scanner-filter', data: params })
      for (const token of scanData.pairs) {
        const tokenData = {
          chain: chainIdToName(token.chainId),
          pair: token.pairAddress,
          token: token.token1Address,
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
  }, [scanData, isConnected])

  if (!scanData) return <div>Loading...</div>
  const pageCount = Math.ceil(scanData.totalRows / PAGE_SIZE)

  return (
    <div className="flex h-full w-full justify-between">
      <div className="flex flex-col w-full h-full">
        <InfiniteTable data={scanData.pairs} page={scanCurrentPage} />
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
