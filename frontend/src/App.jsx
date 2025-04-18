import { useState } from 'react';
// import './App.css';
import PDFFormSection from './FormPage';
import { Routes, Route, Link } from 'react-router-dom';

export const FileStatus = Object.freeze({
  IDLE: 'IDLE', // File not uploaded yet (initial state)
  PROCESSING: 'PROCESSING', // File is being processed by the backend
  SUCCESS: 'SUCCESS', // Backend processing finished successfully
  ERROR: 'ERROR', // An error occurred during upload or processing
});

function App() {
  const [fileStatus, setFileStatus] = useState(FileStatus.SUCCESS);
  const [wineList, setWineList] = useState([]);
  const renderContent = () => {
    switch (fileStatus) {
      case FileStatus.PROCESSING:
        return <p>Processing...</p>;
      case FileStatus.SUCCESS:
        return <FilterableWineList winelist={WINELIST} />;
      case FileStatus.ERROR:
        return(
          <>
            <p>Error occurred during file processing.</p>
            <button onClick={() => setFileStatus(FileStatus.IDLE)}>Back</button>
          </>
        )
      case FileStatus.IDLE:
      default:
        return <PDFFormSection setFileStatus={setFileStatus} setWineList={setWineList}/>;
    }
  }
  return (
    <>
      <header className='flex bg-gray-800 place-content-center items-center h-16 md:h-20 lg:h-24 xl:h-28'>
        <h1 className='text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r to-yellow-100 from-red-700'>Wine List Tool</h1>
      </header>
      <main className="w-9/10 md:w-4/5 xl:w-7/10 place-self-center">
        {/* <Routes>
          <Route path="/" element={<b>test test</b>} />
        </Routes> */}
        {renderContent()}
      </main>
      <footer>
        <p>----footer text----</p>
      </footer>
    </>
  );
}

function Filters () {
  // TODO: implement filters
  // 1. select by wine type
  // 2. Filter by rating (minimum rating)
  // 3. Filter by price (maximum price)
  // 4. Filter by format (750ml, 150ml, etc.)
  // 5. Sort by (rating, price)
  return (
    <form>
      <button>placeholder</button>
    </form>
  );
}

function WineList({ winelist }) {
  const [activeIndex, setActiveIndex] = useState(-1); // -1 if no card is open
  return (
    <div className='space-y-4'>
      {winelist.map((wine, index) => {
        return (
          <WineCard 
            wine={wine}
            isActive={activeIndex === index}
            onToggle={() => setActiveIndex(activeIndex === index? -1 : index)}
            key={index}
          />
        );
      })}
    </div>
  );
}

function WineCard({ wine, isActive, onToggle }) {
  return (
    <>
      <details open={isActive} className='rounded-md marker:content-none'>
        <summary className='p-4 bg-gray-700 cursor-pointer' onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}>
          <div className='flex items-center justify-between text-white'>
            <div className='font-semibold text-sm md:text-base xl:text-lg 2xl:text-xl'>{wine.vivino_match}</div>
            <div className='font-medium text-right text-xs md:text-sm xl:text-base 2xl:text-lg'>{wine.rating_average} &#9733; ({wine.rating_count} reviews) &middot; {wine.type_name} &middot; ${wine.price}</div>
          </div>
        </summary>
        <div className='p-4 bg-gray-600 text-gray-200 text-xs md:text-sm xl:text-base 2xl:text-lg'>
          <p><strong>Name on Wine List:</strong> {wine.wine_name} {wine.vintage}</p>
          <p><strong>Style:</strong> {wine.style_name}</p>
          <p><strong>Grapes:</strong> {wine.grapes_name}</p>
          <p><strong>Volume:</strong> {wine.volume}</p>
        </div>
      </details>
    </>
  );
}

const WINELIST = [
  {'wine_name': 'Champagne Egly-Ouriet, Les Premices, Extra Brut', 'vivino_match': "Egly-Ouriet Les Prémices Brut Champagne Grand Cru 'Ambonnay'", 'rating_average': 4.2, 'rating_count': 2036, 'type_id': 3, 'style_id': 50, 'grapes': [5], 'vintage': 'N.V.', 'price': 50, 'volume': 150, 'type_name': 'Sparkling', 'style_name': 'French Champagne', 'grapes_name': 'Chardonnay'}, 
  {'wine_name': 'Champagne Marguet, Shaman 21, Rosé, Brut Nature', 'vivino_match': 'Dom Pérignon Brut Rosé Champagne', 'rating_average': 4.6, 'rating_count': 15882, 'type_id': 3, 'style_id': 50, 'grapes': [14], 'vintage': 'N.V.', 'price': 60, 'volume': 150, 'type_name': 'Sparkling', 'style_name': 'French Champagne', 'grapes_name': 'Pinot Noir'}, 
  {'wine_name': 'Champagne Dom Pérignon, Brut', 'vivino_match': 'Dom Pérignon Brut Champagne 2015', 'rating_average': 4.4, 'rating_count': 1797, 'type_id': 3, 'style_id': 50, 'grapes': [5, 14], 'vintage': 2015, 'price': 100, 'volume': 150, 'type_name': 'Sparkling', 'style_name': 'French Champagne', 'grapes_name': 'Chardonnay, Pinot Noir'}, 
  {'wine_name': 'Champagne Pierre Péters, Cuvée de Réserve, Brut, Blanc de blancs', 'vivino_match': "Pierre Peters Cuvée de Réserve Blanc de Blancs Brut Champagne Grand Cru 'Le Mesnil-sur-Oger'", 'rating_average': 4.1, 'rating_count': 10588, 'type_id': 3, 'style_id': 50, 'grapes': [5], 'vintage': 'N.V.', 'price': 65, 'volume': 150, 'type_name': 'Sparkling', 'style_name': 'French Champagne', 'grapes_name': 'Chardonnay'}, 
  {'wine_name': 'Jim Bary, Clare Valley, Australia, Assyrtiko', 'vivino_match': 'Jim Barry Assyrtiko 2023', 'rating_average': 3.8, 'rating_count': 127, 'type_id': 2, 'style_id': null, 'grapes': [259], 'vintage': 2023, 'price': 35, 'volume': 150, 'type_name': 'White', 'style_name': 'N.A.', 'grapes_name': 'Assyrtiko'}, 
  {'wine_name': 'Château des Vaults, Domaine du Closel, La Jalousie, Savennières', 'vivino_match': 'Domaine du Closel - Château des Vaults La Jalousie Savennières 2021', 'rating_average': 4.1, 'rating_count': 26, 'type_id': 2, 'style_id': 251, 'grapes': [6], 'vintage': 2021, 'price': 40, 'volume': 150, 'type_name': 'White', 'style_name': 'Loire Chenin Blanc', 'grapes_name': 'Chenin Blanc'}, 
  {'wine_name': 'Domaine Jean Fournier, Clos du Roy, Marsannay', 'vivino_match': "Jean Fournier Marsannay 'Clos du Roy' Rouge 2020", 'rating_average': 4.1, 'rating_count': 116, 'type_id': 1, 'style_id': 283, 'grapes': [14], 'vintage': 2020, 'price': 60, 'volume': 150, 'type_name': 'Red', 'style_name': 'Burgundy Côte de Nuits Red', 'grapes_name': 'Pinot Noir'}, 
  {'wine_name': "Château d'Esclans, Garrus, Côte de Provence, France", 'vivino_match': "Château d'Esclans Garrus Rosé 2022", 'rating_average': 4.4, 'rating_count': 98, 'type_id': 4, 'style_id': 173, 'grapes': [2, 56, 1], 'vintage': 2022, 'price': 55, 'volume': 150, 'type_name': 'Rosé', 'style_name': 'Provence Rosé', 'grapes_name': 'Cabernet Sauvignon, Grenache Blanc, Shiraz/Syrah'}, 
  {'wine_name': 'Château de Beaucastel, Châteauneuf-du-Pape', 'vivino_match': 'Château de Beaucastel Châteauneuf-du-Pape 1995', 'rating_average': 4.3, 'rating_count': 815, 'type_id': 1, 'style_id': 301, 'grapes': [8], 'vintage': 1995, 'price': 680, 'volume': 750, 'type_name': 'Red', 'style_name': 'Southern Rhône Châteauneuf-du-Pape Red', 'grapes_name': 'Grenache'}, 
  {'wine_name': 'Querciabella, Chianti Classico', 'vivino_match': 'Querciabella Chianti Classico 1998', 'rating_average': 4.2, 'rating_count': 98, 'type_id': 1, 'style_id': 887, 'grapes': [16], 'vintage': 1998, 'price': 60, 'volume': 150, 'type_name': 'Red', 'style_name': 'Italian Chianti Classico Red', 'grapes_name': 'Sangiovese'}
];

function FilterableWineList ({ winelist }) {
  return (
    <div>
      <Filters />
      <WineList winelist={winelist}/>
    </div>
  )
};



export default App;
