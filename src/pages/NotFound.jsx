import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-20 font-outfit text-center">
      <div className="max-w-[500px] w-full flex flex-col items-center gap-8">
        
        {/* Large Minimalist 404 */}
        <div className="relative">
          <h1 className="text-[150px] sm:text-[200px] font-black leading-none tracking-tighter text-black opacity-5">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-black">
              Lost in Space
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-gray-500 text-lg sm:text-xl max-w-[320px] mx-auto">
            The page you're looking for has been swapped for something else.
          </p>
        </div>

        <div className="w-full max-w-[280px] pt-4">
          <Link 
            to="/" 
            className="block w-full bg-black text-white border border-black px-8 py-4 rounded text-base hover:bg-white hover:text-black transition-all active:scale-95 font-bold tracking-wide uppercase"
          >
            Return to Safety
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
