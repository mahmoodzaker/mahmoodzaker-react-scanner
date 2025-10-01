import { useState } from 'react'
import { AllChainNames, FilterParams } from '../types/test-task-types'
import { ScannerTable } from './ScannerTable'

const INPUT_CLASS = 'border border-1 border-black rounded-md px-1'
export function ReactScanner() {
  const [filter, setFilter] = useState<FilterParams>({
    chain: 'ALL',
    minVol: 0,
    maxAge: 10000000,
    minMarketCap: 0,
    excludeHoneyPot: true,
  })

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex w-full gap-3 justify-between">
        <span>
          Chain:{' '}
          <select
            className={INPUT_CLASS}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                chain: e.target.value as AllChainNames,
              }))
            }
            defaultValue={filter.chain}
          >
            <option value={'ALL'}>All</option>
            <option value={'ETH'}>ETH</option>
            <option value={'SOL'}>SOL</option>
            <option value={'BASE'}>BASE</option>
            <option value={'BSC'}>BSC</option>
          </select>{' '}
        </span>
        <span>
          Minimum Volume:{' '}
          <input
            value={filter.minVol}
            className={INPUT_CLASS}
            type="number"
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                minVol: parseFloat(e.target.value),
              }))
            }
          />
        </span>
        <span>
          Maximum Age (Sec):{' '}
          <input
            value={filter.maxAge}
            className={INPUT_CLASS}
            type="number"
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                maxAge: parseFloat(e.target.value),
              }))
            }
          />
        </span>
        <span>
          Minimum Market Cap:{' '}
          <input
            value={filter.minMarketCap}
            className={INPUT_CLASS}
            type="number"
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                minMarketCap: parseFloat(e.target.value),
              }))
            }
          />
        </span>
        <span>
          Exclude Honeypots:{' '}
          <input
            checked={filter.excludeHoneyPot}
            className={INPUT_CLASS}
            type="checkbox"
            onChange={(e) =>
              setFilter((f) => ({ ...f, excludeHoneyPot: e.target.checked }))
            }
          />
        </span>
      </div>
      <div className="flex w-full h-full">
        <ScannerTable filter={filter} />
        <ScannerTable byAge filter={filter} />
      </div>
    </div>
  )
}
