const usePasswordValidationComposable = () => {
  const hasTwoCharacterGroups = (value) => {
    if (!value) return true;

    let count = 0;
    if (/[a-z]/.test(value)) count++;
    if (/[A-Z]/.test(value)) count++;
    if (/[0-9]/.test(value)) count++;
    if (/[^a-zA-Z0-9]/.test(value)) count++;

    return count >= 2;
  };
  return {
    hasTwoCharacterGroups,
  };
};

export default usePasswordValidationComposable;
