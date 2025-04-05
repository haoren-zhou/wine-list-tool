import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// import './App.css'

import { Routes, Route, Link } from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <header>
        <p>----header text----</p>
      </header>
      <Routes>
        <Route path="/" element={<b>test test</b>} />
      </Routes>
      {/* <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR hello yes
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
      <FilterableWineList winelist={WINELIST}/>
      <footer>
        <p>----footer text----</p>
      </footer>
    </>
  )
}

function Filters () {
  return (
    <form>
      <button>placeholder</button>
    </form>
  )
}

function WineList({ winelist }) {
  const [activeIndex, setActiveIndex] = useState(-1) // -1 if no card is open
  return (
    <div>
      {winelist.map((wine, index) => {
        return <WineCard 
          wine={wine}
          isActive={activeIndex === index}
          onToggle={() => setActiveIndex(activeIndex === index? -1 : index)}
          key={index}
        />
      })}
    </div>
  )
}

function WineCard({ wine, isActive, onToggle }) {
  return (
    <>
      <details open={isActive} className='border rounded-sm m-4 marker:content-none'>
        <summary className='p-2 bg-gray-900 text-lg' onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}>
          {wine.name}
        </summary>
        <div className='p-2 bg-gray-800'>
          <p>
            Vintage: {wine.vintage}
          </p>
          <p>
            Price: {wine.price} SGD
          </p>
        </div>
      </details>
    </>
  )
}

const WINELIST = [
  {"key": 0, "name": "wine 1 name", "vintage": "2022", "price": 458},
  {"key": 1, "name": "wine 2 name aaa", "vintage": "N.V.", "price": 38},
  {"key": 2, "name": "wine 3 asdiong", "vintage": "2019", "price": 98},
  {"key": 3, "name": "wine4 test", "vintage": "2018", "price": 409},
  {"key": 4, "name": "wine 5", "vintage": "1996", "price": 240},
  {"key": 5, "name": "wine 6 llll'or", "vintage": "2014", "price": 270},
]

function FilterableWineList ({ winelist }) {
  return (
    <div>
      <Filters />
      <WineList winelist={winelist}/>
    </div>
  )
}







export default App
