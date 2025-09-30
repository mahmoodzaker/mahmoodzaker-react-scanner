import { ReactNode, useState } from 'react'
import { AutoSizer, GridCellProps, Index, MultiGrid } from 'react-virtualized'
import { ScannerResult } from '../types/test-task-types'

const ROW_HEIGHT = 50
const COLUMN_WIDTH = [250, 200]
type InfiniteTableProps = {
  data: ScannerResult[]
}

function RowSpan({
  columnIndex,
  children,
}: {
  columnIndex: number
  children: ReactNode
}) {
  return (
    <span style={{ width: `${COLUMN_WIDTH[columnIndex]}px` }}>{children}</span>
  )
}
export function InfiniteTable(props: InfiniteTableProps) {
  const { data } = props
  const [state] = useState({
    fixedColumnCount: 1,
    fixedRowCount: 0,
    scrollToColumn: 0,
    scrollToRow: 0,
  })

  const _cellRenderer = ({
    columnIndex,
    key,
    rowIndex,
    style,
  }: GridCellProps) => {
    const row = data[rowIndex]
    return (
      <div key={key} style={style} className="border border-1 border-[#222222]">
        {columnIndex == 0 && (
          <RowSpan columnIndex={columnIndex}>
            #{rowIndex + 1} {row.token0Symbol}/{row.token1Symbol}
          </RowSpan>
        )}
        {columnIndex == 1 && (
          <RowSpan columnIndex={columnIndex}>
            {row.price}
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
            {...state}
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
