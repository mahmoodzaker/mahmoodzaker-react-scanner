import axios from 'axios'
import { useEffect, useState } from 'react'
import { ScannerApiResponse } from '../types/test-task-types'
import { InfiniteTable } from './InfiniteTable'

export function ReactScanner() {
  const [scanData, setScanData] = useState<ScannerApiResponse>()
  useEffect(() => {
    axios
      .get('https://api-rs.dexcelerate.com/scanner')
      .then((response) => {
        setScanData(response.data)
      })
      .catch((error) => console.error(error))
  }, [])

  if(!scanData) return <div>Loading...</div>
  return (
    <div className="flex h-full w-full justify-between">
      <InfiniteTable data={scanData.pairs} />
      {/*<InfiniteTable />*/}
    </div>
  )
}
