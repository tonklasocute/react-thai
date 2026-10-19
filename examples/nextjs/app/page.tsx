// Server Component: no "use client" here.
import { BahtText } from 'react-thai/baht-text';
import { ThaiDatePicker } from 'react-thai/date-picker';
import { isValidThaiId } from 'react-thai/validators';
import { AddressForm } from './components/AddressForm';

export default function Page() {
  // Pure helpers run on the server.
  const sampleIdValid = isValidThaiId('1-1017-00203-45-0');
  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h1>react-thai + Next.js App Router</h1>
      {/* Client component rendered directly from a Server Component (serialisable props only). */}
      <form action="/api/validate" method="get" style={{ display: 'grid', gap: 12 }}>
        <ThaiDatePicker label="วันเกิด" name="birthday" />
        <button type="submit">ส่ง</button>
      </form>
      {/* Callbacks need your own client component. */}
      <AddressForm />
      <p data-testid="baht">
        <BahtText value={1250.5} />
      </p>
      <p data-testid="server-check">server validator: {String(sampleIdValid)}</p>
    </main>
  );
}
