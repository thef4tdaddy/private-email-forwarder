import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ActivityFeed from './ActivityFeed.svelte';

describe('ActivityFeed Component', () => {
    it('renders empty state message when no activities', () => {
        render(ActivityFeed, { activities: [] });
        expect(screen.getByText('No activity found.')).toBeTruthy();
    });

    it('renders activity rows correctly', () => {
        const activities = [
            { id: 1, subject: 'Receipt 1', sender: 'amazon', status: 'forwarded', category: 'amazon', processed_at: new Date().toISOString() },
            { id: 2, subject: 'Spam 1', sender: 'unknown', status: 'blocked', category: null, processed_at: new Date().toISOString() }
        ];
        render(ActivityFeed, { activities });
        expect(screen.getByText('Receipt 1')).toBeTruthy();
        expect(screen.getByText('Spam 1')).toBeTruthy();
        expect(screen.getAllByRole('row').length).toBe(3); // Header + 2 rows
    });
});
