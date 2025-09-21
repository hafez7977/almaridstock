import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔐 Auth callback page loaded, redirecting to home...');
    // Redirect to home page after callback processing
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;