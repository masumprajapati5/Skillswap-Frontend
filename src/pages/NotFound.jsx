import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 sm:px-6 py-16 sm:py-20 font-outfit text-center">
      <div className="max-w-[500px] w-full flex flex-col items-center gap-6 sm:gap-8">
        
        {/* Large Minimalist 404 */}
        <div className="relative">
          <h1 className="font-black leading-none tracking-tighter text-black opacity-5" style={{ fontSize: 'clamp(100px, 25vw, 200px)' }}>
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black">
              Lost in Space
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-gray-500 text-base sm:text-lg md:text-xl max-w-[320px] mx-auto">
            The page you're looking for has been swapped for something else.
          </p>
        </div>

        <div className="w-full max-w-[280px] pt-4">
          <Link 
            to="/" 
            className="block w-full bg-black text-white border border-black px-8 py-3 sm:py-4 rounded text-sm sm:text-base hover:bg-white hover:text-black transition-all active:scale-95 font-bold tracking-wide uppercase text-center"
          >
            Return to Safety
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
