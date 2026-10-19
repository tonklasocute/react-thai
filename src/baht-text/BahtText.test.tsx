import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BahtText } from './BahtText';

describe('<BahtText>', () => {
  it('renders words and passes props through', () => {
    render(<BahtText value={1234.5} className="total" data-testid="baht" />);
    const el = screen.getByTestId('baht');
    expect(el).toHaveTextContent('หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์');
    expect(el).toHaveClass('rt-baht', 'total');
  });

  it('shows a fallback for invalid values', () => {
    render(<BahtText value="oops" fallback="—" data-testid="baht" />);
    expect(screen.getByTestId('baht')).toHaveTextContent('—');
  });

  it('renders on the server', () => {
    expect(renderToString(<BahtText value={21} />)).toContain('ยี่สิบเอ็ดบาทถ้วน');
  });
});
