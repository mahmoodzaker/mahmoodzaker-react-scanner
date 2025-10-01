import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import './App.css'
import { ReactScanner } from './components/ReactScanner'

function App() {
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <div className="flex h-[100vh]  w-[100vw]">
        <ReactScanner />
      </div>
    </ErrorBoundary>
  )
}
function fallbackRender({ error }: FallbackProps) {
  return (
    <div role="alert" className="text-red-600">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}
export default App
