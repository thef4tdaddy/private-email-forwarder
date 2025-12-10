import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EmailTemplateEditor from './EmailTemplateEditor.svelte';
import * as api from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
	fetchJson: vi.fn()
}));

describe('EmailTemplateEditor Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock window.alert
		global.alert = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('loads template on mount', async () => {
		const mockTemplate = { template: 'Test template: {subject}\n{body}' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);

		render(EmailTemplateEditor);

		await waitFor(() => {
			expect(api.fetchJson).toHaveBeenCalledWith('/settings/email-template');
		});
	});

	it('displays loading state while fetching template', async () => {
		(api.fetchJson as any).mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 100))
		);

		render(EmailTemplateEditor);

		expect(screen.getByText('Loading template...')).toBeTruthy();
	});

	it('displays template content in textarea', async () => {
		const mockTemplate = { template: 'Receipt from {from}\n\n{body}' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);

		render(EmailTemplateEditor);

		await waitFor(() => {
			const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
			expect(textarea.value).toBe('Receipt from {from}\n\n{body}');
		});
	});

	it('displays available variables documentation', async () => {
		(api.fetchJson as any).mockResolvedValueOnce({ template: '' });

		render(EmailTemplateEditor);

		await waitFor(() => {
			expect(screen.getByText(/Available Variables/i)).toBeTruthy();
			expect(screen.getByText(/{subject}/)).toBeTruthy();
			expect(screen.getByText(/{from}/)).toBeTruthy();
			expect(screen.getByText(/{body}/)).toBeTruthy();
		});
	});

	it('save button is disabled when no changes', async () => {
		const mockTemplate = { template: 'Original template' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);

		render(EmailTemplateEditor);

		await waitFor(() => {
			const saveButton = screen.getByText(/Save Template/i) as HTMLButtonElement;
			expect(saveButton.disabled).toBe(true);
		});
	});

	it('save button is enabled when template is modified', async () => {
		const mockTemplate = { template: 'Original template' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);

		render(EmailTemplateEditor);

		await waitFor(() => {
			const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
			expect(textarea).toBeTruthy();
		});

		const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
		await fireEvent.input(textarea, { target: { value: 'Modified template' } });

		await waitFor(() => {
			const saveButton = screen.getByText(/Save Template/i) as HTMLButtonElement;
			expect(saveButton.disabled).toBe(false);
		});
	});

	it('saves template successfully', async () => {
		const mockTemplate = { template: 'Original template' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);
		(api.fetchJson as any).mockResolvedValueOnce({
			template: 'New template',
			message: 'Template updated successfully'
		});

		render(EmailTemplateEditor);

		await waitFor(() => {
			const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
			expect(textarea).toBeTruthy();
		});

		const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
		await fireEvent.input(textarea, { target: { value: 'New template' } });

		const saveButton = screen.getByText(/Save Template/i) as HTMLButtonElement;
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(api.fetchJson).toHaveBeenCalledWith('/settings/email-template', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ template: 'New template' })
			});
			expect(global.alert).toHaveBeenCalledWith('Template saved successfully!');
		});
	});

	it('shows saving state while saving', async () => {
		const mockTemplate = { template: 'Original template' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);
		(api.fetchJson as any).mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve({ template: 'New template' }), 100))
		);

		render(EmailTemplateEditor);

		await waitFor(() => {
			const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
			expect(textarea).toBeTruthy();
		});

		const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
		await fireEvent.input(textarea, { target: { value: 'New template' } });

		const saveButton = screen.getByText(/Save Template/i) as HTMLButtonElement;
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(screen.getByText('Saving...')).toBeTruthy();
		});
	});

	it('disables save button after successful save', async () => {
		const mockTemplate = { template: 'Original template' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);
		(api.fetchJson as any).mockResolvedValueOnce({
			template: 'New template',
			message: 'Template updated successfully'
		});

		render(EmailTemplateEditor);

		await waitFor(() => {
			const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
			expect(textarea).toBeTruthy();
		});

		const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
		await fireEvent.input(textarea, { target: { value: 'New template' } });

		const saveButton = screen.getByText(/Save Template/i) as HTMLButtonElement;
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith('Template saved successfully!');
		});

		// Save button should be disabled again after save
		await waitFor(() => {
			const saveButtonAfter = screen.getByText(/Save Template/i) as HTMLButtonElement;
			expect(saveButtonAfter.disabled).toBe(true);
		});
	});

	it('handles save error gracefully', async () => {
		const mockTemplate = { template: 'Original template' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);
		(api.fetchJson as any).mockRejectedValueOnce(new Error('API Error'));

		render(EmailTemplateEditor);

		await waitFor(() => {
			const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
			expect(textarea).toBeTruthy();
		});

		const textarea = screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement;
		await fireEvent.input(textarea, { target: { value: 'New template' } });

		const saveButton = screen.getByText(/Save Template/i) as HTMLButtonElement;
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith('Error saving template');
		});
	});

	it('handles template loading error gracefully', async () => {
		(api.fetchJson as any).mockRejectedValueOnce(new Error('Network Error'));

		render(EmailTemplateEditor);

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith('Error loading template');
		});
	});

	it('toggles preview on button click', async () => {
		const mockTemplate = { template: 'Subject: {subject}\nFrom: {from}\n\n{body}' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);

		render(EmailTemplateEditor);

		await waitFor(() => {
			const previewButton = screen.getByText(/Show Preview/i);
			expect(previewButton).toBeTruthy();
		});

		const previewButton = screen.getByText(/Show Preview/i);
		await fireEvent.click(previewButton);

		await waitFor(() => {
			expect(screen.getByText(/Preview \(with sample data\)/i)).toBeTruthy();
			expect(screen.getByText(/Hide Preview/i)).toBeTruthy();
		});
	});

	it('hides preview on second toggle', async () => {
		const mockTemplate = { template: 'Subject: {subject}' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);

		render(EmailTemplateEditor);

		await waitFor(() => {
			const previewButton = screen.getByText(/Show Preview/i);
			expect(previewButton).toBeTruthy();
		});

		// Show preview
		const showButton = screen.getByText(/Show Preview/i);
		await fireEvent.click(showButton);

		await waitFor(() => {
			expect(screen.getByText(/Hide Preview/i)).toBeTruthy();
		});

		// Hide preview
		const hideButton = screen.getByText(/Hide Preview/i);
		await fireEvent.click(hideButton);

		await waitFor(() => {
			expect(screen.getByText(/Show Preview/i)).toBeTruthy();
		});
	});

	it('preview shows sample data substitution', async () => {
		const mockTemplate = { template: 'Subject: {subject}\nFrom: {from}\n\n{body}' };
		(api.fetchJson as any).mockResolvedValueOnce(mockTemplate);

		render(EmailTemplateEditor);

		await waitFor(() => {
			const previewButton = screen.getByText(/Show Preview/i);
			expect(previewButton).toBeTruthy();
		});

		const previewButton = screen.getByText(/Show Preview/i);
		await fireEvent.click(previewButton);

		await waitFor(() => {
			const previewContent = screen.getByText(/Your Amazon Order Confirmation/);
			expect(previewContent).toBeTruthy();
			expect(screen.getByText(/no-reply@amazon.com/)).toBeTruthy();
		});
	});
});
