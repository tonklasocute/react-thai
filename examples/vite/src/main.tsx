import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThaiAddressInput, type ThaiAddress } from 'react-thai/address';
import { BahtText } from 'react-thai/baht-text';
import { ThaiDatePicker, toISODate } from 'react-thai/date-picker';
import { ThaiPhoneInput } from 'react-thai/phone';
import { ThaiIdInput } from 'react-thai/thai-id';
import { thaiIdSchema } from 'react-thai/zod';
import 'react-thai/styles.css';

function App() {
  const [date, setDate] = useState<Date | null>(null);
  const [address, setAddress] = useState<ThaiAddress | null>(null);
  const [id, setId] = useState('');
  return (
    <main style={{ maxWidth: 560, margin: '2rem auto', display: 'grid', gap: 16, fontFamily: 'system-ui' }}>
      <h1>react-thai + Vite (React 18)</h1>
      <ThaiDatePicker label="วันเกิด" value={date} onChange={setDate} name="birthday" />
      <ThaiAddressInput label="ที่อยู่" value={address} onChange={setAddress} />
      <ThaiIdInput label="เลขประจำตัวประชาชน" value={id} onChange={setId} />
      <ThaiPhoneInput label="เบอร์โทรศัพท์" output="e164" />
      <p>
        <BahtText value={1250.5} />
      </p>
      <pre>
        {JSON.stringify(
          { date: date && toISODate(date), address, idValid: thaiIdSchema.safeParse(id).success },
          null,
          2,
        )}
      </pre>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
