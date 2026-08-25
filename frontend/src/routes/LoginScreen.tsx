import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Alert, Button, Field, Input, Panel } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';

export function LoginScreen({ redirect = '/library' }: { redirect?: string }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      await login(password);
      void navigate({ to: redirect });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Přihlášení selhalo.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Panel className="mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="text-lg font-extrabold">Heslo trenéra</h1>
        <p className="mt-1 text-sm text-muted">Bez hesla je knihovna jen ke čtení.</p>
      </div>
      <Field label="Heslo">
        <Input
          type="password"
          value={password}
          autoFocus
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submit();
          }}
        />
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button variant="primary" className="w-full" disabled={pending || !password} onClick={() => void submit()}>
        {pending ? 'Ověřuji…' : 'Odemknout úpravy'}
      </Button>
    </Panel>
  );
}
