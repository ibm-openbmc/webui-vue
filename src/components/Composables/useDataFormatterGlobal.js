const useDataFormatterGlobal = () => {
  const dataFormatter = (value) => {
    if (value === undefined || value === null || value === '') {
      return '--';
    } else if (typeof value === 'number') {
      return parseFloat(value.toFixed(3));
    } else {
      return value;
    }
  };
  const statusIconValue = (status) => {
    switch (status) {
      case 'OK':
        return 'success';
      case 'Warning':
        return 'warning';
      case 'Critical':
        return 'danger';
      default:
        return 'unavailable';
    }
  };
  const dataFormatterArray = (value) => {
    return value.join(', ');
  };

  return {
    dataFormatter,
    statusIconValue,
    dataFormatterArray,
  };
};

export default useDataFormatterGlobal;
