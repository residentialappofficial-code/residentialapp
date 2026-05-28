import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';
import { Activity } from 'lucide-react';

describe('StatCard Component', () => {
  it('renders title and primary value text correctly', () => {
    render(
      <StatCard 
        title="Total Pendapatan" 
        value="Rp 15.000.000" 
      />
    );

    expect(screen.getByText(/Total Pendapatan/i)).toBeInTheDocument();
    expect(screen.getByText('Rp 15.000.000')).toBeInTheDocument();
  });

  it('renders positive and negative trends appropriately', () => {
    const { rerender } = render(
      <StatCard 
        title="Total Blok" 
        value="120" 
        change="+5% Bulan Ini"
        isPositive={true}
      />
    );

    const positiveChange = screen.getByText('+5% Bulan Ini');
    expect(positiveChange).toBeInTheDocument();
    expect(positiveChange).toHaveClass('text-emerald-500');

    rerender(
      <StatCard 
        title="Total Blok" 
        value="120" 
        change="-3% Turun"
        isPositive={false}
      />
    );

    const negativeChange = screen.getByText('-3% Turun');
    expect(negativeChange).toBeInTheDocument();
    expect(negativeChange).toHaveClass('text-rose-500');
  });

  it('renders Status Operasional section when status prop is defined', () => {
    render(
      <StatCard 
        title="Status Server" 
        status="Aktif" 
        isPositive={true}
      />
    );

    expect(screen.getByText('Aktif')).toBeInTheDocument();
    expect(screen.getByText('Status Operasional')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toHaveClass('text-emerald-500');
  });

  it('renders SVG progress gauge wheel when gaugeValue prop is supplied', () => {
    render(
      <StatCard 
        title="Tingkat Hunian" 
        gaugeValue={85} 
      />
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
    // Check for existence of the SVG tag used for rendering the circular progress
    const svgElement = screen.getByText('85%').parentElement.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });
});
