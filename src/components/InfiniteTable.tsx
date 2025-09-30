import { ReactNode } from 'react'
import { AutoSizer, GridCellProps, Index, MultiGrid } from 'react-virtualized'
import { chainIdToName, ScannerResult } from '../types/test-task-types'

const ROW_HEIGHT = 50
const COLUMN_WIDTH = [250, 500, 200, 300, 200, 200, 200, 200, 200]
type InfiniteTableProps = {
  data: ScannerResult[]
  page: number
}

function RowSpan({
  columnIndex,
  children,
}: {
  columnIndex: number
  children: ReactNode
}) {
  return (
    <span
      className="flex flex-col overflow-hidden px-1 w-full"
      style={{ width: `${COLUMN_WIDTH[columnIndex]}px` }}
    >
      {children}
    </span>
  )
}
export function InfiniteTable(props: InfiniteTableProps) {
  const { data, page } = props

  const _cellRenderer = ({
    columnIndex,
    key,
    rowIndex,
    style,
  }: GridCellProps) => {
    const row = data[rowIndex]
    return (
      <div
        key={key}
        style={style}
        className="w-full border border-1 border-[#222222]"
      >
        {columnIndex == 0 && (
          <RowSpan columnIndex={columnIndex}>
            <span>
              #{(page - 1) * 100 + rowIndex + 1} {row.token1Name}
            </span>
            <span>
              {row.token0Symbol}/{row.token1Symbol} {chainIdToName(row.chainId)}
            </span>
          </RowSpan>
        )}
        {columnIndex == 1 && (
          <RowSpan columnIndex={columnIndex}>{row.routerAddress}</RowSpan>
        )}
        {columnIndex == 2 && (
          <RowSpan columnIndex={columnIndex}>{row.price}</RowSpan>
        )}
        {columnIndex == 3 && (
          <RowSpan columnIndex={columnIndex}>market cap</RowSpan>
        )}
        {columnIndex == 4 && (
          <RowSpan columnIndex={columnIndex}>{row.volume}</RowSpan>
        )}
        {columnIndex == 5 && (
          <RowSpan columnIndex={columnIndex}>proce chnage</RowSpan>
        )}
        {columnIndex == 6 && (
          <RowSpan columnIndex={columnIndex}>{row.age}</RowSpan>
        )}
        {columnIndex == 7 && (
          <RowSpan columnIndex={columnIndex}>
            <span>{(row.buys || 0) + (row.sells || 0)}</span>
            <span className="flex gap-1">
              <span className="text-green-600">{row.buys || 0}</span>/
              <span className="text-red-600">{row.sells || 0}</span>
            </span>
          </RowSpan>
        )}
        {columnIndex == 8 && (
          <RowSpan columnIndex={columnIndex}>{row.liquidity}</RowSpan>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black text-white">
      <AutoSizer>
        {({ width, height }) => (
          <MultiGrid
            cellRenderer={_cellRenderer}
            columnWidth={(index: Index) => COLUMN_WIDTH[index.index] || 100}
            columnCount={COLUMN_WIDTH.length}
            enableFixedColumnScroll
            enableFixedRowScroll
            height={height}
            rowHeight={ROW_HEIGHT}
            rowCount={data.length}
            noContentRenderer={() => <span>*</span>}
            width={width}
            hideTopRightGridScrollbar
            hideBottomLeftGridScrollbar
            hideBottomRightGridScrollbar
          />
        )}
      </AutoSizer>
    </div>
  )
}
