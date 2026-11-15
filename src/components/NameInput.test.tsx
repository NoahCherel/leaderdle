import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NameInput } from './NameInput';
import { SAMPLE_LEADERS } from '../game/fixtures';
import { createSearch } from '../game/search';

const setup = (tried: string[] = []) => {
  const onSubmit = vi.fn();
  render(<NameInput label="Who is today’s leader?" tried={tried} search={createSearch(SAMPLE_LEADERS)} onSubmit={onSubmit} />);
  const input = screen.getByRole('combobox', { name: 'Who is today’s leader?' });
  return { onSubmit, input, user: userEvent.setup() };
};

describe('NameInput', () => {
  it('on focus, invites to type instead of listing every leader', async () => {
    const { input, user } = setup();
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('listbox')).toHaveTextContent(`Type a few letters: ${SAMPLE_LEADERS.length} leaders to choose from.`);
  });

  it('shows the other name that matched', async () => {
    const { input, user } = setup();
    await user.type(input, 'fdr');
    expect(screen.getByRole('option', { name: /Franklin D. Roosevelt/ })).toHaveTextContent('Also known as FDR');
  });

  it('filters as you type and shows country and term', async () => {
    const { input, user } = setup();
    await user.type(input, 'ma');
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.querySelector('strong')?.textContent)).toEqual(['Margaret Thatcher', 'Nelson Mandela', 'Barack Obama']);
    expect(options[0]).toHaveTextContent('United Kingdom · from 1979, 11 years in office');
  });

  it('submits the active suggestion with Enter and clears the field', async () => {
    const { input, user, onSubmit } = setup();
    await user.type(input, 'ma{ArrowDown}{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('man');
    expect(input).toHaveValue('');
  });

  it('moves with arrow keys and reports the active option', async () => {
    const { input, user } = setup();
    await user.type(input, 'ma{ArrowDown}{ArrowDown}{ArrowUp}');
    const active = document.getElementById(input.getAttribute('aria-activedescendant')!);
    expect(active).toHaveTextContent('Nelson Mandela');
  });

  it('submits a suggestion on click', async () => {
    const { input, user, onSubmit } = setup();
    await user.type(input, 'obama');
    await user.click(screen.getByRole('option', { name: /Barack Obama/ }));
    expect(onSubmit).toHaveBeenCalledWith('oba');
  });

  it('shows already guessed names greyed out; Enter never swaps in another leader', async () => {
    const { input, user, onSubmit } = setup(['tha']);
    await user.type(input, 'ma');
    const thatcher = screen.getByRole('option', { name: /Margaret Thatcher/ });
    expect(thatcher).toHaveAttribute('aria-disabled', 'true');
    expect(thatcher).toHaveTextContent('Already guessed');
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('You already tried Margaret Thatcher.');
  });

  it('arrow keys skip already guessed names', async () => {
    const { input, user, onSubmit } = setup(['tha']);
    await user.type(input, 'ma{ArrowDown}{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('man');
  });

  it('explains when the only match was already tried', async () => {
    const { input, user, onSubmit } = setup(['tha']);
    await user.type(input, 'thatcher{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('You already tried Margaret Thatcher.');
  });

  it('explains an empty or unknown name', async () => {
    const { input, user } = setup();
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Type a name, or pick one from the list.');
    await user.type(input, 'zz{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('No leader found. Check the spelling?');
    expect(screen.getByRole('listbox')).toHaveTextContent('No leader found. Check the spelling?');
  });

  it('reopens the list on click after a guess, while the field keeps focus', async () => {
    const { input, user } = setup();
    await user.type(input, 'kohl{Enter}');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape', async () => {
    const { input, user } = setup();
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('the Guess button submits like Enter', async () => {
    const { input, user, onSubmit } = setup();
    await user.type(input, 'kohl');
    await user.click(screen.getByRole('button', { name: 'Guess' }));
    expect(onSubmit).toHaveBeenCalledWith('koh');
  });
});
