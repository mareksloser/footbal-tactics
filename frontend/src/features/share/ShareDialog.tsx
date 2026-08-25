import { useState } from 'react';
import { Alert, Button, Dialog, Input } from '@/components/ui';
import { apiMode } from '@/api';
import { useTacticMutations } from '@/api/queries';
import type { Tactic } from '@/engine/types';
import { buildPayloadUrl, PAYLOAD_URL_LIMIT } from './codec';

export function ShareDialog({
  open,
  tactic,
  onClose,
}: {
  open: boolean;
  tactic: Tactic;
  onClose: () => void;
}) {
  const { share } = useTacticMutations();
  const [serverLink, setServerLink] = useState<string | null>(null);
  const payloadLink = buildPayloadUrl(window.location.origin, tactic);
  const payloadTooLong = payloadLink.length > PAYLOAD_URL_LIMIT;

  const copy = (value: string) => void navigator.clipboard?.writeText(value);

  return (
    <Dialog open={open} title="Sdílet taktiku" onClose={onClose}>
      <div className="space-y-5">
        <section className="space-y-2">
          <h4 className="text-sm font-bold">Odkaz z knihovny</h4>
          <p className="text-xs text-muted">
            Vytvoří token na serveru. Příjemce vidí vždy aktuální verzi taktiky, ale nemůže ji upravovat.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={serverLink ?? ''} placeholder="zatím nevytvořeno" />
            <Button
              variant="primary"
              disabled={share.isPending}
              onClick={async () => {
                const link = await share.mutateAsync(tactic.id);
                setServerLink(link.url);
                copy(link.url);
              }}
            >
              {share.isPending ? '…' : 'Vytvořit'}
            </Button>
          </div>
          {apiMode === 'local' ? (
            <Alert tone="info">
              V lokálním režimu odkaz funguje jen v tomto prohlížeči. Po napojení PHP API bude platit všude.
            </Alert>
          ) : null}
        </section>

        <section className="space-y-2 border-t border-edge pt-4">
          <h4 className="text-sm font-bold">Odkaz s daty uvnitř</h4>
          <p className="text-xs text-muted">
            Celá taktika je zabalená přímo v adrese — funguje bez serveru i bez přihlášení. Hodí se pro poslání
            rodičům nebo do skupiny na WhatsAppu.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={payloadLink} />
            <Button variant="primary" onClick={() => copy(payloadLink)} disabled={payloadTooLong}>
              Kopírovat
            </Button>
          </div>
          {payloadTooLong ? (
            <Alert>Taktika je moc velká na odkaz s daty. Použij odkaz z knihovny.</Alert>
          ) : (
            <p className="text-xs text-muted">Délka odkazu: {payloadLink.length} znaků.</p>
          )}
        </section>
      </div>
    </Dialog>
  );
}
