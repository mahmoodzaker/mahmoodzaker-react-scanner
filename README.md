## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## `My Approach`

this application consists of these components:

### `Components`

- ReactScanner: ReactScanner is a component for holding tables side by side, since we are using a single client side filtering for both table in this component I implemented Filtering, when changing any filter parameter we pass filter to token tables , inside token tables we are filtering appropriate rows based on filter and showing final filtered rows, since each page has maximum 100 rows, and we are dowing filtering on page rows (not entire list) so filtering is applied to each page individually, for solving this we can fetch entire list (instead of loading page by page on demand) and then showing all rows in a single table without pagination , since I used react-virtualized library for rendering table its possible but there is some challenges because maybe record count is very high.
- ScannerTable: this component is responsible of fetching data from api and connecting websocket and handling websocket data update, currently I connected to websocket for each table individually, we can manage this in parent class and connecting to websocket once and pass events to each ScannerTable separately, but its tricky and need more time. in this component we store a 100 row array and when users goes to other page we refetch data for that page. also using websocket we are updating rows data in real time and showing updated data in InfiniteTable, based on filtering passed form parent component we are filtering rows using a useMemo and showing filtered rows, also in this component we have a sorting section (for right table this sorting is hidden because that one always show based on age) , this filtering parameters are passed to api when user changes it and new data will be shown.
- InfiniteTable: this is a react-virtualized table for showing a long list of rows, currently each page containing Max 100 rows but if there is more rows in each page InfiniteTable will handle it correctly, also if in future we decide to implement single page table, it will not be laggy using this table.

### `Subscribe and Unsubscribe`

When loading a new page from Api we unsubscribe all old token rows (previous page tokens) registered in websocket and then subscribe for new rows so always we sure we only receive data for current rows from websocket.

### `Improvements`

for calculating available pages count we are dividing rows count by 100 (hardcoded) but maybe in future number of rows in each page changes so its better to receive page size in returned data.
