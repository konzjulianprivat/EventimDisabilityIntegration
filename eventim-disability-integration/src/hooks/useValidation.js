import { useState } from 'react';

export function useValidation(initialErrors = {}) {
  const [errors, setErrors] = useState(initialErrors);

  const validate = (field, value, options = {}) => {
    let error = '';
    if (options.required && (!value || !value.trim())) {
      error = 'Dieses Feld ist erforderlich';
    }
    if (!error && options.pattern && value) {
      if (!options.pattern.test(value)) {
        error = options.message || 'Ungültiges Format';
      }
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const classFor = (field, value) => {
    if (value === undefined || value === null || value === '') return '';
    return errors[field] ? 'input-invalid' : 'input-valid';
  };

  const isValid = () => Object.values(errors).every(e => !e);

  return { errors, validate, classFor, isValid };
}
