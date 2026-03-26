const utilitiesFunctions = () => {
  const spaceFilter = (value) => {
    return value.toLowerCase().replace(/\s+/g, '-');
  };

  return { spaceFilter };
};

export default utilitiesFunctions;
