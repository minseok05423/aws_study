interface HomeProps {
  onLogout: () => void;
}

const Home = ({ onLogout }: HomeProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Hi</h1>
        <p className="text-gray-600 mb-6">You have successfully logged in!</p>
        <button
          onClick={onLogout}
          className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;
