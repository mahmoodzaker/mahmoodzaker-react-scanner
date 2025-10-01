import { ReactNode } from 'react'
import { AutoSizer, GridCellProps, Index, MultiGrid } from 'react-virtualized'
import { TokenData } from '../types/test-task-types'

const ROW_HEIGHT = 50
const COLUMN_WIDTH = [250, 500, 200, 300, 200, 200, 200, 200, 200]
type InfiniteTableProps = {
  data: TokenData[]
}

function Header({ children }: { children: ReactNode }) {
  return <span className="flex">{children}</span>
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
      className="flex flex-col overflow-hidden px-1 w-full py-1"
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
    const row = rowIndex == 0 ? null : data[rowIndex - 1]
    return (
      <div
        key={key}
        style={style}
        className={
          'flex w-full border border-1 border-[#222222] items-center' +
          `${row ? '' : ' bg-gray-50 !text-black '}`
        }
      >
        {columnIndex == 0 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? (
              <>
                <span>
                  {row.id} {row.tokenName}
                </span>
                <span>
                  {row.tokenSymbol} {row.chain}
                </span>
              </>
            ) : (
              <Header>Name</Header>
            )}
          </RowSpan>
        )}
        {columnIndex == 1 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? row.exchange : <Header>Route</Header>}
          </RowSpan>
        )}
        {columnIndex == 2 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? row.priceUsd : <Header>Price</Header>}
          </RowSpan>
        )}
        {columnIndex == 3 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? row.mcap : <Header>Market Cap</Header>}
          </RowSpan>
        )}
        {columnIndex == 4 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? row.volumeUsd : <Header>Volume</Header>}
          </RowSpan>
        )}
        {columnIndex == 5 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? (
              <>
                5m:{row.priceChangePcs['5m']}, 1h:{row.priceChangePcs['1h']},
                6h:
                {row.priceChangePcs['6h']}, 24h:{row.priceChangePcs['24h']}
              </>
            ) : (
              <Header>Price changes</Header>
            )}
          </RowSpan>
        )}
        {columnIndex == 6 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? (
              `${(now - row.tokenCreatedTimestamp.getTime()) / 1000} Sec`
            ) : (
              <Header>Age</Header>
            )}
          </RowSpan>
        )}
        {columnIndex == 7 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? (
              <>
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
              </>
            ) : (
              <Header>Buy/Sells</Header>
            )}
          </RowSpan>
        )}
        {columnIndex == 8 && (
          <RowSpan columnIndex={columnIndex}>
            {row ? row.liquidity.current : <Header>Liquidity</Header>}
          </RowSpan>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black text-white">
      <AutoSizer>
        {({ width, height }) => (
          <MultiGrid
            fixedRowCount={1}
            cellRenderer={_cellRenderer}
            columnWidth={(index: Index) => COLUMN_WIDTH[index.index] || 100}
            columnCount={COLUMN_WIDTH.length}
            enableFixedColumnScroll
            enableFixedRowScroll
            height={height}
            rowHeight={ROW_HEIGHT}
            rowCount={data.length + 1}
            noContentRenderer={() => <span>No Row</span>}
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
