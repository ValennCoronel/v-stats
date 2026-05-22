import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function LoginScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="mb-2" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '56px',
          fontWeight: 700,
          lineHeight: 1.2,
          background: 'linear-gradient(135deg, #0D1F33 0%, #1E6FD9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          V-Stats
        </h1>
        <p style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '12px',
          letterSpacing: '2px',
          color: '#1E6FD9',
          textTransform: 'uppercase'
        }}>
          Datos que ganan partidos
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm space-y-4">
        <Input
          type="email"
          placeholder="Email"
          className="h-12 bg-white border-[#E2E8F0]"
        />
        <Input
          type="password"
          placeholder="Password"
          className="h-12 bg-white border-[#E2E8F0]"
        />

        <Button
          onClick={() => navigate('/home')}
          className="w-full h-12 bg-[#1E6FD9] hover:bg-[#1557B0]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '1px' }}
        >
          INICIAR SESIÓN
        </Button>

        <Button
          onClick={() => navigate('/home')}
          variant="outline"
          className="w-full h-12 border-[#1E6FD9] text-[#1E6FD9] hover:bg-[#1E6FD9]/5"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '1px' }}
        >
          CONTINUAR SIN CUENTA
        </Button>

        <div className="text-center pt-4">
          <a href="#" className="text-sm text-[#64748B] hover:text-[#1E6FD9]">
            ¿No tenés cuenta? <span className="text-[#1E6FD9]">Registrate</span>
          </a>
        </div>
      </div>
    </div>
  );
}
