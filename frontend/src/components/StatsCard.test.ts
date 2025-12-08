import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import StatsCard from './StatsCard.svelte';

describe('StatsCard Component', () => {
    it('renders title and value correctly', () => {
        render(StatsCard, { title: 'Test Stat', value: 42 });
        expect(screen.getByText('Test Stat')).toBeTruthy();
        expect(screen.getByText('42')).toBeTruthy();
    });

    it('renders subtext when provided', () => {
        render(StatsCard, { title: 'Test Stat', value: 10, subtext: 'more info' });
        expect(screen.getByText('more info')).toBeTruthy();
    });

    it('does not render subtext when not provided', () => {
        render(StatsCard, { title: 'Test Stat', value: 10 });
        const subtext = screen.queryByText('more info');
        expect(subtext).toBeNull();
    });
});
