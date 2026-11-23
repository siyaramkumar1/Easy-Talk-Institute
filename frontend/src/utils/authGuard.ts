import { useAuthStore } from '../store/useAuthStore';
import { NavigateFunction } from 'react-router-dom';

export const handleProtectedAction = (
  navigate: NavigateFunction, 
  actionPath: string, 
  state?: any
) => {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    navigate('/login', { state: { from: actionPath, message: 'Please login or register to continue.' } });
  } else {
    navigate(actionPath, { state });
  }
};
