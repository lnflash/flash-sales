import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CountryToggleSimple } from '@/components/territories/CountryToggleSimple';

describe('CountryToggleSimple', () => {
  const mockCountries = [
    { code: 'JM', name: 'Jamaica', flagEmoji: '🇯🇲' },
    { code: 'KY', name: 'Cayman Islands', flagEmoji: '🇰🇾' },
    { code: 'CW', name: 'Curaçao', flagEmoji: '🇨🇼' }
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all country buttons', () => {
    render(
      <CountryToggleSimple
        countries={mockCountries}
        selectedCountry=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('🇯🇲')).toBeInTheDocument();
    expect(screen.getByText('🇰🇾')).toBeInTheDocument();
    expect(screen.getByText('🇨🇼')).toBeInTheDocument();
  });

  it('shows All Countries button when showAll is true', () => {
    render(
      <CountryToggleSimple
        countries={mockCountries}
        selectedCountry=""
        onChange={mockOnChange}
        showAll={true}
      />
    );

    expect(screen.getByText('All Countries')).toBeInTheDocument();
  });

  it('highlights selected country', () => {
    render(
      <CountryToggleSimple
        countries={mockCountries}
        selectedCountry="KY"
        onChange={mockOnChange}
      />
    );

    const caymanButton = screen.getByTitle('Cayman Islands');
    expect(caymanButton).toHaveClass('bg-primary');
  });

  it('calls onChange when country is clicked', () => {
    render(
      <CountryToggleSimple
        countries={mockCountries}
        selectedCountry=""
        onChange={mockOnChange}
      />
    );

    const jamaicaButton = screen.getByTitle('Jamaica');
    fireEvent.click(jamaicaButton);

    expect(mockOnChange).toHaveBeenCalledWith('JM');
  });

  it('calls onChange with empty string when All Countries is clicked', () => {
    render(
      <CountryToggleSimple
        countries={mockCountries}
        selectedCountry="JM"
        onChange={mockOnChange}
        showAll={true}
      />
    );

    const allButton = screen.getByText('All Countries');
    fireEvent.click(allButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('shows country code on mobile view', () => {
    render(
      <CountryToggleSimple
        countries={mockCountries}
        selectedCountry=""
        onChange={mockOnChange}
      />
    );

    // The component uses hidden/block classes for responsive display
    mockCountries.forEach(country => {
      const button = screen.getByTitle(country.name);
      expect(button.innerHTML).toContain(country.code);
    });
  });
});