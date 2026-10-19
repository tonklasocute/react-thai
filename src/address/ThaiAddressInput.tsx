import {
  forwardRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cx } from '../core/cx';
import { describedBy, Field, fieldIds, type FieldOwnProps, type FieldSlot } from '../core/Field';
import { useControllable } from '../core/useControllable';
import { formatThaiAddress } from './format';
import type { AddressSuggestion, MatchRange } from './search';
import type { AddressField, ThaiAddress } from './types';
import { useThaiAddress } from './useThaiAddress';

export type AddressInputSlot =
  | FieldSlot
  | 'grid'
  | 'field'
  | 'fieldLabel'
  | 'combobox'
  | 'input'
  | 'listbox'
  | 'option'
  | 'optionMain'
  | 'optionSub'
  | 'postcode'
  | 'mark'
  | 'empty';

export interface AddressLabels {
  searchPlaceholder: string;
  subdistrict: string;
  subdistrictBangkok: string;
  district: string;
  districtBangkok: string;
  province: string;
  postcode: string;
  suggestions: string;
  loading: string;
  noResults: string;
  loadError: string;
  results: (count: number) => string;
}

const LABELS: Record<'th' | 'en', AddressLabels> = {
  th: {
    searchPlaceholder: 'พิมพ์ตำบล อำเภอ จังหวัด หรือรหัสไปรษณีย์',
    subdistrict: 'ตำบล/แขวง',
    subdistrictBangkok: 'แขวง',
    district: 'อำเภอ/เขต',
    districtBangkok: 'เขต',
    province: 'จังหวัด',
    postcode: 'รหัสไปรษณีย์',
    suggestions: 'ที่อยู่ที่แนะนำ',
    loading: 'กำลังโหลดข้อมูลที่อยู่…',
    noResults: 'ไม่พบที่อยู่ที่ตรงกัน',
    loadError: 'โหลดข้อมูลที่อยู่ไม่สำเร็จ',
    results: (n) => `พบ ${n} รายการ ใช้ลูกศรขึ้นลงเพื่อเลือก`,
  },
  en: {
    searchPlaceholder: 'Type a subdistrict, district, province or postcode',
    subdistrict: 'Subdistrict',
    subdistrictBangkok: 'Subdistrict (Khwaeng)',
    district: 'District',
    districtBangkok: 'District (Khet)',
    province: 'Province',
    postcode: 'Postcode',
    suggestions: 'Suggested addresses',
    loading: 'Loading address data…',
    noResults: 'No matching address',
    loadError: 'Could not load address data',
    results: (n) => `${n} results, use up and down arrows to choose`,
  },
};

export interface ThaiAddressInputProps extends FieldOwnProps {
  /** Selected address, or `null`. Only complete addresses from the dataset are emitted. */
  value?: ThaiAddress | null;
  defaultValue?: ThaiAddress | null;
  /** Called with the chosen address, or `null` once the user edits the text again. */
  onChange?: (address: ThaiAddress | null) => void;
  onBlur?: () => void;
  /** `search` (default): one search box. `split`: four linked inputs (classic Thai form). */
  fields?: 'search' | 'split';
  /** Load English names too, show them in suggestions and match English queries. */
  includeEnglish?: boolean;
  /** Maximum suggestions. Default `10`. */
  limit?: number;
  /** UI language for labels. Default `th`. */
  locale?: 'th' | 'en';
  labels?: Partial<AddressLabels>;
  placeholder?: string;
  /** Prefix for hidden inputs: `${name}.subdistrict`, `.district`, `.province`, `.postcode`. */
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  className?: string;
  classNames?: Partial<Record<AddressInputSlot, string>>;
}

type Texts = Record<AddressField | 'all', string>;

const textsFor = (a: ThaiAddress | null): Texts => ({
  all: a ? formatThaiAddress(a) : '',
  subdistrict: a?.subdistrict ?? '',
  district: a?.district ?? '',
  province: a?.province ?? '',
  postcode: a?.postcode ?? '',
});

const SPLIT_FIELDS: readonly AddressField[] = ['subdistrict', 'district', 'province', 'postcode'];

/**
 * Thai address autocomplete. Type a postcode, ตำบล/แขวง, อำเภอ/เขต or จังหวัด and pick a
 * suggestion to fill all four parts. The dataset is lazy-loaded on first focus.
 */
export const ThaiAddressInput = forwardRef<HTMLInputElement, ThaiAddressInputProps>(
  function ThaiAddressInput(props, ref) {
    const {
      value,
      defaultValue = null,
      onChange,
      onBlur,
      fields = 'search',
      includeEnglish,
      limit = 10,
      locale = 'th',
      labels: labelOverrides,
      placeholder,
      name,
      id: idProp,
      disabled,
      required,
      label,
      hint,
      error,
      className,
      classNames = {},
    } = props;
    const autoId = useId();
    const id = idProp ?? autoId;
    const labels = { ...LABELS[locale], ...labelOverrides };
    const data = useThaiAddress({ includeEnglish, preload: false, limit });
    const [address, setAddress] = useControllable(value, defaultValue, onChange);
    const [texts, setTexts] = useState(() => textsFor(address));

    // Sync text when the value changes from outside (not from our own typing).
    const emitted = useRef(address);
    const [synced, setSynced] = useState(address);
    if (synced !== address) {
      setSynced(address);
      if (address !== emitted.current) setTexts(textsFor(address));
      emitted.current = address;
    }
    const emit = (next: ThaiAddress | null) => {
      emitted.current = next;
      if (next !== address) setAddress(next);
    };

    const select = (next: ThaiAddress) => {
      setTexts(textsFor(next));
      emit(next);
    };
    const type = (key: keyof Texts) => (text: string) => {
      setTexts((t) => ({ ...t, [key]: text }));
      emit(null);
    };

    const describe = describedBy(id, { hint, error }, props['aria-describedby']);
    const common = {
      data,
      limit,
      labels,
      classNames,
      disabled,
      required,
      onSelect: select,
      onBlur,
      describedBy: describe,
      invalid: !!error,
    };

    const hidden =
      name &&
      SPLIT_FIELDS.map((f) => (
        <input key={f} type="hidden" name={`${name}.${f}`} value={address?.[f] ?? ''} />
      ));

    if (fields === 'split') {
      const fieldLabel = (f: AddressField) =>
        f === 'subdistrict'
          ? address?.isBangkok
            ? labels.subdistrictBangkok
            : labels.subdistrict
          : f === 'district'
            ? address?.isBangkok
              ? labels.districtBangkok
              : labels.district
            : labels[f];
      return (
        <Field
          id={id}
          base="rt-addr rt-addr--split"
          label={label}
          labelFor={false}
          hint={hint}
          error={error}
          invalid={!!error}
          disabled={disabled}
          className={className}
          classNames={classNames}
        >
          <div
            role="group"
            aria-labelledby={label != null ? fieldIds(id).label : undefined}
            aria-label={label == null ? props['aria-label'] : undefined}
            className={cx('rt-addr__grid', classNames.grid)}
          >
            {SPLIT_FIELDS.map((f, i) => (
              <div key={f} className={cx('rt-addr__field', classNames.field)}>
                <label
                  htmlFor={`${id}-${f}`}
                  className={cx('rt-label', 'rt-addr__label', classNames.fieldLabel)}
                >
                  {fieldLabel(f)}
                </label>
                <AddressCombobox
                  {...common}
                  id={`${id}-${f}`}
                  inputRef={i === 0 ? ref : undefined}
                  field={f}
                  text={texts[f]}
                  onText={type(f)}
                  inputMode={f === 'postcode' ? 'numeric' : undefined}
                  autoComplete={f === 'postcode' ? 'postal-code' : 'off'}
                />
              </div>
            ))}
          </div>
          {hidden}
        </Field>
      );
    }

    return (
      <Field
        id={id}
        base="rt-addr"
        label={label}
        hint={hint}
        error={error}
        invalid={!!error}
        disabled={disabled}
        className={className}
        classNames={classNames}
      >
        <AddressCombobox
          {...common}
          id={id}
          inputRef={ref}
          ariaLabel={label == null ? props['aria-label'] : undefined}
          placeholder={placeholder ?? labels.searchPlaceholder}
          text={texts.all}
          onText={type('all')}
          autoComplete="off"
        />
        {hidden}
      </Field>
    );
  },
);

interface ComboboxProps {
  id: string;
  data: ReturnType<typeof useThaiAddress>;
  field?: AddressField;
  text: string;
  onText: (text: string) => void;
  onSelect: (address: ThaiAddress) => void;
  onBlur?: () => void;
  limit: number;
  labels: AddressLabels;
  classNames: Partial<Record<AddressInputSlot, string>>;
  inputRef?: Ref<HTMLInputElement>;
  ariaLabel?: string;
  placeholder?: string;
  describedBy?: string;
  invalid: boolean;
  disabled?: boolean;
  required?: boolean;
  inputMode?: 'numeric';
  autoComplete: string;
}

function Highlight({
  text,
  match,
  className,
}: {
  text: string;
  match?: MatchRange;
  className?: string;
}) {
  if (!match) return <>{text}</>;
  return (
    <>
      {text.slice(0, match.start)}
      <mark className={cx('rt-addr__mark', className)}>{text.slice(match.start, match.end)}</mark>
      {text.slice(match.end)}
    </>
  );
}

function AddressCombobox(p: ComboboxProps) {
  const { data, labels, classNames } = p;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = `${p.id}-listbox`;
  const query = p.text.trim();

  const results = useMemo<AddressSuggestion[]>(
    () => (open && query ? data.search(query, { field: p.field, limit: p.limit }) : []),
    [open, query, data, p.field, p.limit],
  );
  const showPopup = open && !!query;
  const expanded = showPopup && results.length > 0;
  const optionId = (i: number) => `${listId}-${i}`;

  useEffect(() => {
    if (active >= 0)
      document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' });
    // optionId is derived from a stable id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const choose = (suggestion: AddressSuggestion | undefined) => {
    if (!suggestion) return;
    p.onSelect(suggestion.address);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = results.length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) setOpen(true);
        else if (count) setActive((a) => (a + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) setOpen(true);
        else if (count) setActive((a) => (a <= 0 ? count - 1 : a - 1));
        break;
      case 'Enter':
        if (expanded && active >= 0) {
          event.preventDefault();
          choose(results[active]);
        }
        break;
      case 'Escape':
        if (expanded) {
          event.preventDefault();
          setOpen(false);
          setActive(-1);
        } else if (p.text) {
          event.preventDefault();
          p.onText('');
        }
        break;
    }
  };

  let status: ReactNode = '';
  if (showPopup) {
    status =
      data.status === 'error'
        ? labels.loadError
        : data.status !== 'ready'
          ? labels.loading
          : results.length
            ? labels.results(results.length)
            : labels.noResults;
  }

  return (
    <div className={cx('rt-addr__combo', classNames.combobox)}>
      <input
        ref={p.inputRef}
        id={p.id}
        type="text"
        role="combobox"
        aria-label={p.ariaLabel}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
        aria-describedby={p.describedBy}
        aria-invalid={p.invalid || undefined}
        className={cx('rt-input', 'rt-addr__input', classNames.input)}
        value={p.text}
        placeholder={p.placeholder}
        disabled={p.disabled}
        required={p.required}
        inputMode={p.inputMode}
        autoComplete={p.autoComplete}
        spellCheck={false}
        onFocus={() => {
          if (data.status === 'idle' || data.status === 'error') void data.load();
        }}
        onChange={(e) => {
          p.onText(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
          p.onBlur?.();
        }}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label={labels.suggestions}
        className={cx('rt-addr__listbox', classNames.listbox)}
        hidden={!expanded}
      >
        {expanded &&
          results.map((r, i) => {
            const a = r.address;
            const th = (f: AddressField) =>
              r.matches[f]?.lang === 'th' ? r.matches[f] : undefined;
            const en = (f: AddressField) =>
              r.matches[f]?.lang === 'en' ? r.matches[f] : undefined;
            const mark = classNames.mark;
            return (
              // Keyboard interaction is handled on the combobox input (aria-activedescendant).
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={r.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                className={cx('rt-addr__option', classNames.option)}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => active !== i && setActive(i)}
                onClick={() => choose(r)}
              >
                <span className={cx('rt-addr__option-main', classNames.optionMain)}>
                  {a.subdistrictPrefix}
                  <Highlight text={a.subdistrict} match={th('subdistrict')} className={mark} />
                  {' · '}
                  {a.districtPrefix}
                  <Highlight text={a.district} match={th('district')} className={mark} />
                  {' · '}
                  <Highlight text={a.province} match={th('province')} className={mark} />
                </span>
                <span className={cx('rt-addr__postcode', classNames.postcode)}>
                  <Highlight text={a.postcode} match={r.matches.postcode} className={mark} />
                </span>
                {a.en && (
                  <span className={cx('rt-addr__option-sub', classNames.optionSub)} lang="en">
                    <Highlight text={a.en.subdistrict} match={en('subdistrict')} className={mark} />
                    {', '}
                    <Highlight text={a.en.district} match={en('district')} className={mark} />
                    {', '}
                    <Highlight text={a.en.province} match={en('province')} className={mark} />
                  </span>
                )}
              </li>
            );
          })}
      </ul>
      {showPopup && !expanded && (
        <div
          className={cx('rt-addr__listbox', 'rt-addr__empty', classNames.empty)}
          aria-hidden="true"
        >
          {status}
        </div>
      )}
      <div role="status" className="rt-sr-only">
        {status}
      </div>
    </div>
  );
}
