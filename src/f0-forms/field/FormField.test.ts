import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import FormField from './FormField.svelte';

describe('FormField', () => {
  afterEach(() => cleanup());

  it('renders a label with the provided text', () => {
    const { container } = render(FormField, {
      props: {
        id: 'name',
        label: 'Name',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('label')?.textContent).toContain('Name');
  });

  it('for on the label matches the id prop', () => {
    const { container } = render(FormField, {
      props: {
        id: 'email',
        label: 'Email',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('label')?.getAttribute('for')).toBe('email');
  });

  it('renders the input container div', () => {
    const { container } = render(FormField, {
      props: {
        id: 'test',
        label: 'Test',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('.ds-form-input-container')).not.toBeNull();
  });

  it('shows error message when error prop is provided', () => {
    const { container } = render(FormField, {
      props: {
        id: 'field',
        label: 'Field',
        error: 'This field is required',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('.ds-form-error-text')?.textContent).toBe(
      'This field is required'
    );
  });

  it('error span has role="alert"', () => {
    const { container } = render(FormField, {
      props: {
        id: 'field',
        label: 'Field',
        error: 'Invalid',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('renders helper text when helper prop is provided and no error', () => {
    const { container } = render(FormField, {
      props: {
        id: 'field',
        label: 'Field',
        helper: 'Enter your full name',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('.ds-form-helper-text')?.textContent).toBe(
      'Enter your full name'
    );
  });

  it('does not render helper text when error is present', () => {
    const { container } = render(FormField, {
      props: {
        id: 'field',
        label: 'Field',
        error: 'Required',
        helper: 'Some hint',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('.ds-form-helper-text')).toBeNull();
  });

  it('helper text has correct id linked to field id', () => {
    const { container } = render(FormField, {
      props: {
        id: 'username',
        label: 'Username',
        helper: 'Choose a unique name',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('#username-helper')).not.toBeNull();
  });

  it('applies custom class to wrapper', () => {
    const { container } = render(FormField, {
      props: {
        id: 'field',
        label: 'Field',
        class: 'my-field',
        children: () => '<input />',
      },
    });
    expect(container.querySelector('.my-field')).not.toBeNull();
  });
});
