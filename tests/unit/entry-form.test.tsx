import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryForm } from '@/components/admin/entry-form';
import type { FieldSpec } from '@/lib/content/form-fields';

// A Server Action cannot execute in jsdom, and these tests are about the
// form's own state handling (lines/json fields), not the save round trip.
const saveSpy = vi.fn();
vi.mock('@/app/actions/content', () => ({
  saveEntry: (previous: unknown, formData: FormData) => saveSpy(previous, formData),
}));

const fields: FieldSpec[] = [
  { name: 'slug', kind: 'text', required: true },
  { name: 'includes', kind: 'lines', required: false },
  { name: 'meta', kind: 'json', required: false },
];

function hiddenDataValue(container: HTMLElement): unknown {
  const input = container.querySelector('input[name="data"]') as HTMLInputElement;
  return JSON.parse(input.value);
}

describe('EntryForm lines fields', () => {
  afterEach(() => saveSpy.mockReset());

  it('lets a new line be added and reflects it in the submitted data', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EntryForm
        collection="services"
        fields={fields}
        initial={{ slug: 'interior-painting', includes: ['Walls'], meta: {} }}
        initialStatus="draft"
        media={[]}
      />,
    );

    const includes = screen.getByLabelText(/includes/i) as HTMLTextAreaElement;
    await user.clear(includes);
    await user.type(includes, 'Walls{enter}Ceilings');

    expect(includes.value).toBe('Walls\nCeilings');
    expect(hiddenDataValue(container)).toMatchObject({ includes: ['Walls', 'Ceilings'] });
  });
});

describe('EntryForm json fields', () => {
  afterEach(() => saveSpy.mockReset());

  it('shows a parse error and disables both submit buttons until the JSON is fixed', async () => {
    const user = userEvent.setup();
    render(
      <EntryForm
        collection="projects"
        fields={fields}
        initial={{ slug: 'a-project', includes: [], meta: {} }}
        initialStatus="draft"
        media={[]}
      />,
    );

    const meta = screen.getByLabelText(/meta/i) as HTMLTextAreaElement;
    const draftButton = screen.getByRole('button', { name: /save draft/i });
    const publishButton = screen.getByRole('button', { name: /publish/i });

    await user.clear(meta);
    // Plain text, deliberately brace-free: user-event's keyboard syntax
    // treats `{`/`[` as the start of a key descriptor, so this avoids the
    // escaping dance while still being invalid JSON.
    await user.type(meta, 'not valid json');

    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
    expect(draftButton).toBeDisabled();
    expect(publishButton).toBeDisabled();

    await user.clear(meta);
    // A literal `{` is typed by doubling it; a lone `}` needs no escaping.
    await user.type(meta, '{{}');

    expect(screen.queryByText(/invalid json/i)).not.toBeInTheDocument();
    expect(draftButton).not.toBeDisabled();
    expect(publishButton).not.toBeDisabled();
  });
});
