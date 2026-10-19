'use client';

import { useState } from 'react';
import { formatThaiAddress, ThaiAddressInput, type ThaiAddress } from 'react-thai/address';
import { ThaiPhoneInput } from 'react-thai/phone';

export function AddressForm() {
  const [address, setAddress] = useState<ThaiAddress | null>(null);
  const [phone, setPhone] = useState('');
  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <ThaiAddressInput label="ที่อยู่" fields="split" value={address} onChange={setAddress} />
      <ThaiPhoneInput label="เบอร์โทรศัพท์" value={phone} onChange={setPhone} output="e164" />
      <output>{address ? formatThaiAddress(address) : 'ยังไม่ได้เลือกที่อยู่'}</output>
    </section>
  );
}
