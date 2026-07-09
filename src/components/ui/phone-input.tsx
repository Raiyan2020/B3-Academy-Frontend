'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as RPNInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type PhoneInputProps = Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'value' | 'ref'
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange' | 'value'> & {
    value?: RPNInput.Value | string;
    onChange?: (value: RPNInput.Value | '') => void;
  };

const PhoneInput = React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
  ({ className, onChange, value, ...props }, ref) => (
    <div dir="ltr" className="w-full">
      <RPNInput.default
        ref={ref}
        className={cn('flex w-full', className)}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneNumberField}
        smartCaret={false}
        value={(value || undefined) as RPNInput.Value | undefined}
        onChange={(nextValue) => onChange?.(nextValue || '')}
        {...props}
      />
    </div>
  ),
);
PhoneInput.displayName = 'PhoneInput';

const PhoneNumberField = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="tel"
      dir="ltr"
      className={cn('rounded-l-none border-l-0 text-left focus-visible:z-10', className)}
    />
  ),
);
PhoneNumberField.displayName = 'PhoneNumberField';

type CountryEntry = {
  label: string;
  value: RPNInput.Country | undefined;
};

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

function CountrySelect({
  disabled,
  value: selectedCountry,
  options,
  onChange,
}: CountrySelectProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState('');
  const [open, setOpen] = React.useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setSearchValue('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="rounded-r-none px-3 focus:z-10"
          disabled={disabled}
          aria-label="Select phone country"
        >
          <FlagComponent country={selectedCountry} countryName={selectedCountry} />
          <ChevronsUpDown className="size-4 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0" dir="ltr">
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={(nextValue) => {
              setSearchValue(nextValue);
              requestAnimationFrame(() => {
                const viewport = scrollAreaRef.current?.querySelector(
                  '[data-radix-scroll-area-viewport]',
                );
                viewport?.scrollTo({ top: 0 });
              });
            }}
            placeholder="Search country..."
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {options.map(({ value, label }) =>
                  value ? (
                    <CountryOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onSelect={(country) => {
                        onChange(country);
                        setOpen(false);
                      }}
                    />
                  ) : null,
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface CountryOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onSelect: (country: RPNInput.Country) => void;
}

function CountryOption({
  country,
  countryName,
  selectedCountry,
  onSelect,
}: CountryOptionProps) {
  return (
    <CommandItem className="gap-2" onSelect={() => onSelect(country)}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-slate-500">+{RPNInput.getCountryCallingCode(country)}</span>
      <Check
        className={cn('ml-auto size-4', country === selectedCountry ? 'opacity-100' : 'opacity-0')}
        aria-hidden="true"
      />
    </CommandItem>
  );
}

function FlagComponent({ country, countryName }: RPNInput.FlagProps) {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-slate-200">
      {Flag ? <Flag title={countryName} /> : null}
    </span>
  );
}

export { PhoneInput };
export type { PhoneInputProps };
