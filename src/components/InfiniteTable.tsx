import { ReactNode } from 'react'
import { AutoSizer, GridCellProps, Index, MultiGrid } from 'react-virtualized'
import { TokenData } from '../types/test-task-types'

const ROW_HEIGHT = 50
const COLUMN_WIDTH = [250, 500, 200, 300, 200, 200, 200, 200, 200]
type InfiniteTableProps = {
  data: TokenData[]
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
  const { data } = props

  const _cellRenderer = ({
    columnIndex,
    key,
    rowIndex,
    style,
  }: GridCellProps) => {
    const now = Date.now()
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
              {row.id} {row.tokenName}
            </span>
            <span>
              {row.tokenSymbol} {row.chain}
            </span>
          </RowSpan>
        )}
        {columnIndex == 1 && (
          <RowSpan columnIndex={columnIndex}>{row.exchange}</RowSpan>
        )}
        {columnIndex == 2 && (
          <RowSpan columnIndex={columnIndex}>{row.priceUsd}</RowSpan>
        )}
        {columnIndex == 3 && (
          <RowSpan columnIndex={columnIndex}>{row.mcap}</RowSpan>
        )}
        {columnIndex == 4 && (
          <RowSpan columnIndex={columnIndex}>{row.volumeUsd}</RowSpan>
        )}
        {columnIndex == 5 && (
          <RowSpan columnIndex={columnIndex}>
            5m:{row.priceChangePcs['5m']}, 1h:{row.priceChangePcs['1h']}, 6h:
            {row.priceChangePcs['6h']}, 24h:{row.priceChangePcs['24h']}
          </RowSpan>
        )}
        {columnIndex == 6 && (
          <RowSpan columnIndex={columnIndex}>
            {(now - row.tokenCreatedTimestamp.getTime()) / 1000} sec
          </RowSpan>
        )}
        {columnIndex == 7 && (
          <RowSpan columnIndex={columnIndex}>
            <span>
              {(row.transactions.buys || 0) + (row.transactions.sells || 0)}
            </span>
            <span className="flex gap-1">
              <span className="text-green-600">
                {row.transactions.buys || 0}
              </span>
              /
              <span className="text-red-600">
                {row.transactions.sells || 0}
              </span>
            </span>
          </RowSpan>
        )}
        {columnIndex == 8 && (
          <RowSpan columnIndex={columnIndex}>{row.liquidity.current}</RowSpan>
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
