import { ScannerTable } from './ScannerTable'

export function ReactScanner() {
  return (
    <div className="flex w-full">
      <ScannerTable />
      <ScannerTable byAge />
    </div>
  )
}
