
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username dan password harus diisi');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setErrorMessage('Username atau password salah');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Masuk ke Sistem
        </CardTitle>
        <p className="text-gray-600">
          Masukkan kredensial Anda untuk mengakses sistem arsip digital
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              disabled={isLoading}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memverifikasi...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Masuk
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
