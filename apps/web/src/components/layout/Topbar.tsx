import { useAppSelector, useAppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';

export const Topbar = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
      <div className="flex-1" />
      
      <div className="flex items-center space-x-4">
        <div className="text-sm font-medium hidden md:block">
          {user?.name}
        </div>
        <Avatar className="h-10 w-10 border border-gray-200">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} alt={user?.name} />
          <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout} 
          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </header>
  );
};
